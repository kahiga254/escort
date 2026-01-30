export interface User {
    id: string;
    _id?: string;
    full_name: string;
    phone_no: string;
    image_url: string;
    services: string[];
    location: string;
}

export interface ApiResponse{
    success: boolean;
    data: User[];
    count?: number;
    error?: string;
    message?: string;
}

export interface SearchFilters {
    location?: string;
    service?: string;
    query?: string;
    page?: number;
    limit?: number;
}