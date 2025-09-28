<template>
  <v-data-table
    :items="formattedUsers"
    :headers="headers"
    :loading="loading"
    class="elevation-1"
  >
    <template #no-data>
      <div class="pa-6 text-center">No hay usuarios para mostrar.</div>
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import api from '@/services/api'

type Usuario = { 
  id: number
  nombre: string
  email: string
  rol: 'admin' | 'usuario'
  created_at: string
  updated_at: string
  tenant_id?: string
}

const props = defineProps<{ searchTerm?: string }>()

const items = ref<Usuario[]>([])
const loading = ref(false)

const headers = [
  { title: 'Nombre', value: 'nombre' },
  { title: 'Email',  value: 'email' },
  { title: 'Rol',    value: 'rol' },
  { title: 'Tenant', value: 'tenant_id' },
  { title: 'Fecha de Creación', value: 'created_at' }
]

const fetchUsers = async () => {
  loading.value = true
  try {
    const response = await api.get('/usuarios/listUsers')
    const data = response.data
    
    if (data && data.success && Array.isArray(data.data)) {
      items.value = data.data
    } else if (data && Array.isArray(data)) {
      items.value = data
    } else if (data && data.data && Array.isArray(data.data)) {
      items.value = data.data
    } else {
      console.error('Estructura de respuesta inesperada:', data)
      items.value = []
    }
  } catch (error) {
    console.error('Error al cargar usuarios:', error)
    items.value = []
  } finally {
    loading.value = false
  }
}

defineExpose({ fetchUsers })

onMounted(fetchUsers)

const filtered = computed(() => {
  const q = (props.searchTerm || '').toLowerCase().trim()
  if (!q) return items.value || []
  
  if (!Array.isArray(items.value)) {
    console.warn('items.value no es un array:', items.value)
    return []
  }
  
  return items.value.filter(u =>
    u.nombre.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q)  ||
    u.rol.toLowerCase().includes(q)
  )
})

const formattedUsers = computed(() => {
  if (!Array.isArray(filtered.value)) {
    console.warn('filtered.value no es un array:', filtered.value)
    return []
  }
  
  return filtered.value.map(user => ({
    ...user,
    created_at: new Date(user.created_at).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }))
})


</script>
