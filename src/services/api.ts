import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
})


api.interceptors.request.use((config) => {
  // rutas que no deben llevar token
  const noAuthEndpoints = ['/login', '/register']

  if (!noAuthEndpoints.includes(config.url || '')) {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export const taskApi = {

  getAllTasks: () => api.get('/tareas'),
  
  getTaskById: (id: number) => api.get(`/tareas/${id}`),
  
  createTask: (taskData: {
    usuario_id: number
    titulo: string
    descripcion?: string
    estado?: 'pendiente' | 'en_progreso' | 'completada'
    fecha_vencimiento?: string
  }) => api.post('/tareas', taskData),
  
  updateTask: (id: number, taskData: {
    titulo?: string
    descripcion?: string
    estado?: 'pendiente' | 'en_progreso' | 'completada'
    fecha_vencimiento?: string
  }) => api.put(`/tareas/${id}`, taskData),
  
  deleteTask: (id: number) => api.delete(`/tareas/${id}`),
  
  getTasksByUser: (userId: number) => api.get(`/tareas/usuario/${userId}`),
  
  getTasksByStatus: (status: 'pendiente' | 'en_progreso' | 'completada') => 
    api.get(`/tareas/estado/${status}`),
  
}


export const userApi = {

  getAllUsers: () => api.get('/usuarios/listUsers'),
  
  getUserById: (id: number) => api.get(`/usuarios/getUser/${id}`),
  
  createUser: (userData: {
    nombre: string
    email: string
    password: string
    rol?: string
  }) => api.post('/usuarios/addUser', userData),
  
  updateUser: (id: number, userData: {
    nombre?: string
    email?: string
  }) => api.put(`/usuarios/updateUser/${id}`, userData),
  
  deleteUser: (id: number) => api.delete(`/usuarios/deleteUser/${id}`)
}

export const authApi = {
  login: (credentials: { email: string; password: string }) => 
    api.post('/login', credentials),
  
  logout: () => api.post('/logout')
}

export default api
