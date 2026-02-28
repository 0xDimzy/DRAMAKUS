export interface Drama {
  id: string;
  bookId?: string;
  title: string;
  poster: string;
  duration?: string;
  thumbnail?: string;
  genre?: string;
  rating?: string;
  description?: string;
  total_episode?: string;
  status?: string;
  director?: string;
  cast?: string;
  country?: string;
  release_date?: string;
}

export interface Episode {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  duration?: string;
}

export const API_CODE = 'A179DA133C8F05A184D12D5823D8062A';
