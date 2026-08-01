/**
 * Interface User merepresentasikan entitas pengguna dalam sistem mikulogin.
 * Menyimpan data dasar pengguna termasuk identitas, email, hash kata sandi, dan timestamp.
 */
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  createdAt: Date;
}

/**
 * Interface Session merepresentasikan sesi aktif yang dimiliki pengguna.
 * Menghubungkan token sesi dengan userId dan waktu kadaluarsa (expiresAt).
 */
export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
}

/**
 * Interface DatabaseAdapter didefinisikan sebagai kontrak abstraksi
 * Bring Your Own Database (BYOD) yang harus diimplementasikan oleh adapter database.
 */
export interface DatabaseAdapter {
  /**
   * Mengambil data pengguna berdasarkan alamat email.
   * @param email Alamat email pengguna.
   * @returns Pengguna jika ditemukan, atau null jika tidak ada.
   */
  getUserByEmail(email: string): Promise<User | null>;

  /**
   * Membuat pengguna baru dalam database.
   * @param data Data pengguna tanpa id dan createdAt (dihasilkan otomatis oleh adapter/DB).
   * @returns Pengguna yang berhasil dibuat.
   */
  createUser(data: Omit<User, "id" | "createdAt">): Promise<User>;

  /**
   * Membuat sesi pengguna baru dalam database.
   * @param userId ID pengguna pemilik sesi.
   * @param token Token acak unik untuk identifikasi sesi.
   * @param expiresAt Waktu sesi akan kadaluarsa.
   * @returns Sesi yang berhasil dibuat.
   */
  createSession(userId: string, token: string, expiresAt: Date): Promise<Session>;

  /**
   * Validasi token sesi dan ambil data sesi beserta penggunanya sekaligus.
   * @param token Token sesi yang dikirim oleh klien.
   * @returns Objek berisi session dan user jika token valid, atau null jika tidak ditemukan/kadaluarsa.
   */
  getSessionAndUser(token: string): Promise<{ session: Session; user: User } | null>;
}
