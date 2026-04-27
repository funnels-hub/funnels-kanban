export interface Hospital {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HospitalCreate {
  name: string;
  email: string;
  password: string;
}

export interface HospitalUpdate {
  name?: string;
  password?: string;
  is_active?: boolean;
}
