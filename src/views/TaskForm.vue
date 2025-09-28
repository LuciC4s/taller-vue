<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card>
          <v-card-title class="text-h5 text-center pa-4">
            {{ isEditing ? 'Editar Tarea' : 'Nueva Tarea' }}
          </v-card-title>
          
          <v-card-text>
            <v-form ref="formRef" @submit.prevent="handleSubmit">
              <v-row>
                <v-col cols="12">
                  <v-select
                    v-model="form.usuario_id"
                    :items="users"
                    item-title="nombre"
                    item-value="id"
                    label="Usuario Asignado"
                    :rules="[rules.required]"
                    variant="outlined"
                    prepend-icon="mdi-account"
                    :loading="loadingUsers"
                    :disabled="loadingUsers"
                    :error-messages="users.length === 0 && !loadingUsers ? 'No hay usuarios disponibles' : ''"
                  >
                    <template v-slot:no-data>
                      <div class="text-center pa-2">
                        <div v-if="loadingUsers" class="text-body-2">Cargando usuarios...</div>
                        <div v-else class="text-body-2 text-grey">No hay usuarios disponibles</div>
                      </div>
                    </template>
                  </v-select>
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="form.titulo"
                    label="Título de la Tarea"
                    variant="outlined"
                    prepend-icon="mdi-format-title"
                    counter="150"
                    maxlength="150"
                  />
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="form.descripcion"
                    label="Descripción"
                    variant="outlined"
                    prepend-icon="mdi-text"
                    rows="3"
                    counter="500"
                    maxlength="500"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                    v-model="form.estado"
                    :items="estados"
                    label="Estado"
                    variant="outlined"
                    prepend-icon="mdi-flag"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="form.fecha_vencimiento"
                    label="Fecha de Vencimiento"
                    type="date"
                    variant="outlined"
                    prepend-icon="mdi-calendar"
                    :min="minDate"
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>

          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn
              color="grey"
              variant="text"
              @click="goBack"
              :disabled="loading"
            >
              Cancelar
            </v-btn>
            <v-btn
              color="primary"
              variant="elevated"
              @click="handleSubmit"
              :loading="loading"
            >
              {{ isEditing ? 'Actualizar' : 'Crear' }} Tarea
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { taskApi, userApi } from '@/services/api'

const router = useRouter()
const route = useRoute()

const props = defineProps<{
  id?: string | number
}>()

const taskId = computed(() => {
  if (props.id) {
    return typeof props.id === 'string' ? parseInt(props.id) : props.id
  }
  return undefined
})

const form = reactive({
  usuario_id: null as number | null,
  titulo: '',
  descripcion: '',
  estado: 'pendiente' as 'pendiente' | 'en_progreso' | 'completada',
  fecha_vencimiento: ''
})

const valid = ref(false)
const loading = ref(false)
const loadingUsers = ref(false)
const users = ref<Array<{ 
  id: number
  nombre: string
  email: string
  tenant_id?: string
}>>([])
const formRef = ref()

const isEditing = computed(() => !!taskId.value)

const estados = [
  { title: 'Pendiente', value: 'pendiente' },
  { title: 'En Progreso', value: 'en_progreso' },
  { title: 'Completada', value: 'completada' }
]

const minDate = new Date().toISOString().split('T')[0]

const rules = {
  required: (value: any) => !!value || 'Este campo es requerido',
  maxLength: (max: number) => (value: string) => 
    !value || value.length <= max || `Máximo ${max} caracteres`,
  dateValidation: (value: string) => {
    if (!value) return true
    const selectedDate = new Date(value)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return selectedDate >= today || 'La fecha debe ser mayor o igual a hoy'
  }
}

const loadUsers = async () => {
  try {
    loadingUsers.value = true
    const response = await userApi.getAllUsers()
    const data = response.data
    
    if (data && data.success && Array.isArray(data.data)) {
      users.value = data.data
    } else if (data && Array.isArray(data)) {
      users.value = data
    } else if (data && data.data && Array.isArray(data.data)) {
      users.value = data.data
    } else {
      console.error('Estructura de respuesta inesperada:', data)
      users.value = []
    }
  } catch (error) {
    console.error('Error loading users:', error)
    users.value = []
  } finally {
    loadingUsers.value = false
  }
}

const loadTask = async () => {
  if (!taskId.value) return
  
  try {
    loading.value = true
    const response = await taskApi.getTaskById(taskId.value)
    const task = response.data.data || response.data
    
    form.usuario_id = task.usuario_id
    form.titulo = task.titulo
    form.descripcion = task.descripcion || ''
    form.estado = task.estado
    form.fecha_vencimiento = task.fecha_vencimiento || ''
  } catch (error) {
    console.error('Error loading task:', error)
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!form.usuario_id || !form.titulo.trim()) {
    alert('Por favor completa todos los campos requeridos')
    return
  }
  
  try {
    loading.value = true
    
    const taskData = {
      usuario_id: form.usuario_id!,
      titulo: form.titulo,
      descripcion: form.descripcion || undefined,
      estado: form.estado,
      fecha_vencimiento: form.fecha_vencimiento || undefined
    }
    
    if (isEditing.value) {
      await taskApi.updateTask(taskId.value!, taskData)
    } else {
      await taskApi.createTask(taskData)
    }
    
    router.push('/tareas')
  } catch (error) {
    console.error('Error saving task:', error)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/tareas')
}

onMounted(async () => {
  await loadUsers()
  if (isEditing.value) {
    await loadTask()
  }
})
</script>

<style scoped>
.v-card {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>

