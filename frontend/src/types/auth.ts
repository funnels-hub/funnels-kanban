export interface LoginRequest {
  email: string;
  password: string;
}

export interface HospitalPublic {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
}

export interface AuthResponse {
  access_token: string;
  hospital: HospitalPublic;
}
