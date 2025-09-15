<v-container fluid>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card class="pa-6">
          <v-card-title class="text-h5 mb-4">
            {{ isEditing ? 'Editar Usuario' : 'Agregar Usuario' }}
          </v-card-title>

          <v-form ref="formRef" v-model="valid" @submit.prevent="submitForm">
            <v-text-field
              v-model="form.nombre"
              label="Nombre"
              :rules="nombreRules"
              required
              variant="outlined"
              class="mb-4"
            />

            <v-text-field
              v-model="form.email"
              label="Email"
              type="email"
              :rules="emailRules"
              required
              variant="outlined"
              class="mb-4"
            />

            <v-text-field
              v-model="form.password"
              label="Contraseña"
              type="password"
              :rules="passwordRules"
              :required="!isEditing"
              variant="outlined"
              class="mb-4"
            />

            <v-select
              v-model="form.rol"
              label="Rol"
              :items="rolOptions"
              :rules="rolRules"
              required
              variant="outlined"
              class="mb-6"
            />

            <v-row>
              <v-col cols="6">
                <v-btn
                  type="submit"
                  color="primary"
                  :loading="loading"
                  :disabled="!valid"
                  block
                >
                  {{ isEditing ? 'Actualizar' : 'Crear' }}
                </v-btn>
              </v-col>
              <v-col cols="6">
                <v-btn
                  color="grey"
                  variant="outlined"
                  @click="goBack"
                  block
                >
                  Cancelar
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/services/api'

type UserForm = {
  nombre: string
  email: string
  password: string
  rol: 'admin' | 'usuario'
}

const props = defineProps<{ id?: string }>()
const route = useRoute()
const router = useRouter()

const formRef = ref()
const valid = ref(false)
const loading = ref(false)

const form = reactive<UserForm>({
  nombre: '',
  email: '',
  password: '',
  rol: 'usuario'
})

const isEditing = computed(() => !!props.id || !!route.params.id)

const rolOptions = [
  { title: 'Usuario', value: 'usuario' },
  { title: 'Administrador', value: 'admin' }
]

const nombreRules = [
  (v: string) => !!v || 'El nombre es requerido',
  (v: string) => (v && v.length >= 2) || 'El nombre debe tener al menos 2 caracteres'
]

const emailRules = [
  (v: string) => !!v || 'El email es requerido',
  (v: string) => /.+@.+\..+/.test(v) || 'El email debe ser válido'
]

const passwordRules = [
  (v: string) => {
    if (isEditing.value) return true // Password is optional when editing
    return !!v || 'La contraseña es requerida'
  },
  (v: string) => {
    if (isEditing.value) return true
    return (v && v.length >= 6) || 'La contraseña debe tener al menos 6 caracteres'
  }
]

const rolRules = [
  (v: string) => !!v || 'El rol es requerido'
]

const submitForm = async () => {
  if (!valid.value) return

  loading.value = true
  try {
    const payload = {
      nombre: form.nombre,
      email: form.email,
      password: form.password,
      rol: form.rol
    }

    if (isEditing.value) {
      console.log('Update user:', payload)
    } else {
      await api.post('/usuarios/addUser', payload)
      
      console.log('Usuario creado exitosamente')
      
      router.push('/usuarios')
    }
  } catch (error: any) {
    console.error('Error al crear usuario:', error)
    alert('Error al crear el usuario. Por favor, inténtalo de nuevo.')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/usuarios')
}

onMounted(() => {
  if (isEditing.value) {
    console.log('Loading user for editing:', props.id || route.params.id)
  }
})
</script>