import axios from 'axios'

function getTenantFromEmail(email: string): string {
  const domain = email.split('@')[1]?.toLowerCase()
  
  const emailToTenantMap: Record<string, string> = {
    'empresa1.com': 'empresa1',
    'empresa1.midominio.com': 'empresa1',
    'empresa2.com': 'empresa2', 
    'empresa2.midominio.com': 'empresa2'
  }
  
  return emailToTenantMap[domain || ''] || 'empresa1'
}

function getCurrentTenant(): string {
  return localStorage.getItem('current_tenant') || 'empresa1'
}

function getApiBaseURL(tenantId: string): string {
  return `http://${tenantId}.midominio.com:8000/api`
}

function createApiInstance(tenantId?: string) {
  const currentTenant = tenantId || getCurrentTenant()
  const baseURL = getApiBaseURL(currentTenant)
  
  return axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  })
}

const api = createApiInstance()

api.interceptors.request.use(
  (config) => {
    const currentTenant = getCurrentTenant()
    config.baseURL = getApiBaseURL(currentTenant)
    
    const noAuthEndpoints = ['/login', '/register']
    
    if (!noAuthEndpoints.includes(config.url || '')) {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export async function loginWithTenantDetection(credentials: { email: string; password: string }) {
  const tenantId = getTenantFromEmail(credentials.email)
  const tenantApi = createApiInstance(tenantId)
  
  tenantApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })
  
  try {
    const response = await tenantApi.post('/login', credentials)
    
    localStorage.setItem('current_tenant', tenantId)
    
    api.defaults.baseURL = getApiBaseURL(tenantId)
    
    return response
  } catch (error) {
    throw error
  }
}

export function initializeApiWithTenant() {
  const currentTenant = getCurrentTenant()
  api.defaults.baseURL = getApiBaseURL(currentTenant)
  return currentTenant
}

export { getTenantFromEmail, getApiBaseURL, createApiInstance, getCurrentTenant }

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
  
  register: (userData: {
    nombre: string
    email: string
    password: string
    password_confirmation: string
    rol?: string
  }) => api.post('/register', userData),
  
  logout: () => api.post('/logout'),
  
  getUser: () => api.get('/user')
}

export default api
