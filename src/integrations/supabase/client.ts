/* eslint-disable @typescript-eslint/no-explicit-any */
// Client-side local proxy simulating Supabase API to interact with the local PostgreSQL/Express server instead.
export type AppRole = "admin" | "user";

class MockAuth {
  private listeners: Array<(event: string, session: any) => void> = [];

  constructor() {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("velocity_user");
      if (user) {
        setTimeout(() => this.trigger("SIGNED_IN", this.getSessionSync()), 50);
      }
    }
  }

  private trigger(event: string, session: any) {
    this.listeners.forEach((l) => l(event, session));
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    this.listeners.push(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners = this.listeners.filter((l) => l !== callback);
          },
        },
      },
    };
  }

  async getSession() {
    const session = this.getSessionSync();
    return { data: { session }, error: null };
  }

  getSessionSync() {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("velocity_user");
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      return {
        access_token: user.id,
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: user.id,
        user,
      };
    } catch {
      return null;
    }
  }

  async getUser() {
    const session = this.getSessionSync();
    if (!session) return { data: { user: null }, error: new Error("No session active") };
    return { data: { user: session.user }, error: null };
  }

  async signInWithPassword({ email, password }: any) {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          data: { user: null, session: null },
          error: new Error(data.error || "Gagal masuk."),
        };
      }

      localStorage.setItem("velocity_user", JSON.stringify(data.user));
      const session = this.getSessionSync();
      this.trigger("SIGNED_IN", session);
      return { data: { user: data.user, session }, error: null };
    } catch (err: any) {
      return {
        data: { user: null, session: null },
        error: new Error(err.message || "Gagal masuk."),
      };
    }
  }

  async signUp({ email, password, options }: any) {
    try {
      const fullName = options?.data?.full_name || "";
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName }),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          data: { user: null, session: null },
          error: new Error(data.error || "Pendaftaran gagal."),
        };
      }

      localStorage.setItem("velocity_user", JSON.stringify(data.user));
      const session = this.getSessionSync();
      this.trigger("SIGNED_IN", session);
      return { data: { user: data.user, session }, error: null };
    } catch (err: any) {
      return {
        data: { user: null, session: null },
        error: new Error(err.message || "Pendaftaran gagal."),
      };
    }
  }

  async signOut() {
    localStorage.removeItem("velocity_user");
    this.trigger("SIGNED_OUT", null);
    return { error: null };
  }
}

class QueryBuilder {
  private table: string;
  private action: string = "select";
  private selectCols: string = "*";
  private insertData: any = null;
  private updateData: any = null;
  private filters: Array<{ col: string; val: any }> = [];
  private orderCol: string | null = null;
  private orderAsc: boolean = true;
  private limitCount: number | null = null;
  private single: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(cols: string = "*") {
    this.action = "select";
    this.selectCols = cols;
    return this;
  }

  insert(data: any) {
    this.action = "insert";
    this.insertData = data;
    return this;
  }

  update(data: any) {
    this.action = "update";
    this.updateData = data;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ col, val });
    return this;
  }

  order(col: string, options?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderAsc = options?.ascending !== false;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  maybeSingle() {
    this.single = true;
    return this;
  }

  single() {
    this.single = true;
    return this;
  }

  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      const userStr = typeof window !== "undefined" ? localStorage.getItem("velocity_user") : null;
      const user = userStr ? JSON.parse(userStr) : null;
      const headers: any = { "Content-Type": "application/json" };
      if (user) {
        headers["Authorization"] = `Bearer ${user.id}`;
      }

      const response = await fetch("/api/db", {
        method: "POST",
        headers,
        body: JSON.stringify({
          table: this.table,
          action: this.action,
          selectCols: this.selectCols,
          insertData: this.insertData,
          updateData: this.updateData,
          filters: this.filters,
          orderCol: this.orderCol,
          orderAsc: this.orderAsc,
          limitCount: this.limitCount,
          single: this.single,
        }),
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.error || "Gagal melakukan query database.");
      }

      const result = {
        data: resJson.data,
        error: null,
        count:
          resJson.count ??
          (Array.isArray(resJson.data) ? resJson.data.length : resJson.data ? 1 : 0),
      };

      if (onfulfilled) {
        return onfulfilled(result);
      }
      return result;
    } catch (err: any) {
      const result = { data: null, error: { message: err.message || "Error" } };
      if (onrejected) {
        return onrejected(err);
      }
      return result;
    }
  }
}

class StorageBucket {
  private bucket: string;
  constructor(bucket: string) {
    this.bucket = bucket;
  }

  async upload(path: string, file: File, options?: any) {
    try {
      // Read file to Base64 Data URL so it is transferred reliably and preserved
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Gagal membaca berkas gambar dari perangkat."));
        reader.readAsDataURL(file);
      });

      const response = await fetch("/api/storage/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path,
          bucket: this.bucket,
          fileData,
          fileName: file.name,
          contentType: file.type || "image/jpeg",
          size: file.size,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload gagal");
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }

  async createSignedUrl(path: string, expiry: number) {
    try {
      if (!path) return { data: null, error: null };
      if (path.startsWith("data:") || path.startsWith("http://") || path.startsWith("https://")) {
        return { data: { signedUrl: path }, error: null };
      }

      const response = await fetch(
        `/api/storage/signed-url?path=${encodeURIComponent(path)}&expiry=${expiry}`,
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal mengambil URL gambar");
      return { data: { signedUrl: data.signedUrl }, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }
}

class MockStorage {
  from(bucket: string) {
    return new StorageBucket(bucket);
  }
}

class LocalSupabaseClient {
  auth = new MockAuth();
  storage = new MockStorage();

  from(table: string) {
    return new QueryBuilder(table);
  }

  async rpc(rpcName: string, rpcArgs: any = {}) {
    try {
      const userStr = typeof window !== "undefined" ? localStorage.getItem("velocity_user") : null;
      const user = userStr ? JSON.parse(userStr) : null;
      const headers: any = { "Content-Type": "application/json" };
      if (user) {
        headers["Authorization"] = `Bearer ${user.id}`;
      }

      const response = await fetch("/api/db", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "rpc",
          rpcName,
          rpcArgs,
        }),
      });
      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.error || "Gagal memanggil fungsi RPC.");
      }
      return { data: resJson.data, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message || "Error RPC" } };
    }
  }
}

export const supabase = new LocalSupabaseClient() as any;
