<template>
  <v-app>
    <v-app-bar>
      <template v-slot:prepend>
        <v-icon icon="mdi-domain" class="me-2" />
      </template>
      
      <v-app-bar-title>
        Taller Laravel + Vue
      </v-app-bar-title>
      
      <template v-slot:append>
        <v-chip
          :color="tenantChipColor"
          variant="elevated"
          size="small"
          class="me-2"
        >
          <v-icon start icon="mdi-account-group" />
          {{ currentTenantDisplay }}
        </v-chip>
        
        <v-btn
          v-if="isAuthenticated"
          icon="mdi-logout"
          variant="text"
          @click="logout"
          title="Cerrar Sesión"
        />
      </template>
    </v-app-bar>
    
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentTenant } from '@/services/api'

const router = useRouter()

const currentTenant = computed(() => getCurrentTenant())

const isAuthenticated = computed(() => {
  return !!localStorage.getItem('auth_token')
})

const currentTenantDisplay = computed(() => {
  const tenant = currentTenant.value
  if (!tenant) return 'Sin Tenant'
  
  const capitalizedTenant = tenant.charAt(0).toUpperCase() + tenant.slice(1)
  return `${capitalizedTenant}`
})

const tenantChipColor = computed(() => {
  const tenant = currentTenant.value
  const colors = {
    'empresa1': 'blue',
    'empresa2': 'purple'
  }
  return colors[tenant as keyof typeof colors] || 'grey'
})

const logout = () => {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user_data')
  localStorage.removeItem('current_tenant')
  router.push('/login')
}
</script>