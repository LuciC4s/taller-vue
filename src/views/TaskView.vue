<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="text-subtitle-1 mb-2">Navegación</div>
          <v-list density="compact" class="pa-0">
            <v-list-item
              prepend-icon="mdi-account-group"
              title="Usuarios"
              :active="$route.name === 'usuarios'"
              @click="goToUsers"
            />
            <v-list-item
              prepend-icon="mdi-clipboard-list"
              title="Tareas"
              :active="$route.name === 'tareas'"
              @click="goToTasks"
            />
          </v-list>

          <v-divider class="my-4" />

          <div class="text-subtitle-1 mb-2">Acciones</div>

          <v-btn block color="primary" class="mb-3"  :disabled="!isAdmin"  @click="goAddUser" >
            Agregar usuario
          </v-btn>

          <v-btn block color="success" class="mb-3" @click="goAddTask">
            Nueva tarea
          </v-btn>

          <v-btn block color="error" variant="tonal" @click="logout">
            Cerrar sesión
          </v-btn>

          <v-divider class="my-4" />

          <div class="text-caption">
            Sesión: <strong>{{ user?.nombre }}</strong> ({{ user?.rol }})
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="9">
        <v-card>
          <v-card-title>
            <span class="text-h5">Gestión de Tareas</span>
          </v-card-title>

          <v-card-text>
            <v-row class="mb-4">
              <v-col cols="12" md="4">
                <v-select  v-model="filters.estado"  :items="estadoOptions" label="Filtrar por Estado" clearable variant="outlined" density="compact" @update:model-value="loadTasks" />
              </v-col>
              <v-col cols="12" md="4">
                <v-select  v-model="filters.usuario_id" :items="userOptions" label="Filtrar por Usuario" clearable variant="outlined" density="compact" @update:model-value="loadTasks" />
              </v-col>
              <v-col cols="12" md="4" class="d-flex justify-end align-center">
                <v-btn color="primary" variant="elevated" prepend-icon="mdi-plus" @click="goToCreateTask">
                  Nueva Tarea
                </v-btn>
              </v-col>
            </v-row>

            <v-data-table :headers="headers" :items="tasks" :loading="loading" :items-per-page="10" class="elevation-1" :search="search" >
              <template v-slot:item.estado="{ item }">
                <v-chip
                  :color="getEstadoColor(item.estado)"
                  :variant="getEstadoVariant(item.estado)"
                  size="small"
                >
                  {{ getEstadoText(item.estado) }}
                </v-chip>
              </template>

              <template v-slot:item.fecha_vencimiento="{ item }">
                <span v-if="item.fecha_vencimiento">
                  {{ formatDate(item.fecha_vencimiento) }}
                </span>
                <span v-else class="text-grey">Sin fecha</span>
              </template>

              <template v-slot:item.usuario="{ item }">
                <div>
                  <div class="font-weight-medium">
                    {{ item.usuario?.nombre || "N/A" }}
                  </div>
                  <div class="text-caption text-grey">
                    {{ item.usuario?.email || "" }}
                  </div>
                </div>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-tooltip text="Editar tarea">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-pencil" size="small" color="primary" variant="text" @click="editTask(item.id)"/>
                  </template>
                </v-tooltip>
                <v-tooltip text="Eliminar tarea">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-delete" size="small" color="error" variant="text" @click="confirmDelete(item)" />
                  </template>
                </v-tooltip>
              </template>

              <template v-slot:no-data>
                <div class="text-center pa-4">
                  <v-icon size="64" color="grey"
                    >mdi-clipboard-text-outline</v-icon
                  >
                  <div class="text-h6 mt-2">No hay tareas</div>
                  <div class="text-body-2 text-grey">
                    Crea tu primera tarea para comenzar
                  </div>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Confirmar Eliminación</v-card-title>
        <v-card-text>
          ¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se
          puede deshacer.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" variant="text" @click="deleteDialog = false">
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            @click="deleteTask"
            :loading="deleting"
          >
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { taskApi, userApi } from "@/services/api";

type User = {
  id: number;
  nombre: string;
  email: string;
  rol: "admin" | "usuario";
};

const router = useRouter();
const user = ref<User | null>(null);

const tasks = ref<any[]>([]);
const users = ref<Array<{ id: number; nombre: string; email: string }>>([]);
const loading = ref(false);
const search = ref("");
const deleteDialog = ref(false);
const deleting = ref(false);
const taskToDelete = ref<number | null>(null);

const filters = reactive({
  estado: null as string | null,
  usuario_id: null as number | null,
});

const headers = [
  { title: "ID", key: "id", sortable: true },
  { title: "Título", key: "titulo", sortable: true },
  { title: "Descripción", key: "descripcion", sortable: false },
  { title: "Estado", key: "estado", sortable: true },
  { title: "Usuario Asignado", key: "usuario", sortable: false },
  { title: "Fecha Vencimiento", key: "fecha_vencimiento", sortable: true },
  { title: "Creada", key: "created_at", sortable: true },
  { title: "Acciones", key: "actions", sortable: false, align: "center" },
];

const estadoOptions = [
  { title: "Pendiente", value: "pendiente" },
  { title: "En Progreso", value: "en_progreso" },
  { title: "Completada", value: "completada" },
];

const userOptions = computed(() =>
  users.value.map((user) => ({
    title: user.nombre,
    value: user.id,
  }))
);

const isAdmin = computed(() => user.value?.rol === "admin");

const loadUsers = async () => {
  try {
    const response = await userApi.getAllUsers();
    users.value = response.data || [];
  } catch (error) {
    console.error("Error loading users:", error);
  }
};

const loadTasks = async () => {
  try {
    loading.value = true;
    let response;

    if (filters.estado) {
      response = await taskApi.getTasksByStatus(filters.estado as any);
    } else if (filters.usuario_id) {
      response = await taskApi.getTasksByUser(filters.usuario_id);
    } else {
      response = await taskApi.getAllTasks();
    }

    tasks.value = response.data.data || [];
  } catch (error) {
    console.error("Error loading tasks:", error);
    tasks.value = [];
  } finally {
    loading.value = false;
  }
};

const editTask = (taskId: number) => {
  router.push(`/tareas/${taskId}/editar`);
};

const confirmDelete = (task: any) => {
  taskToDelete.value = task.id;
  deleteDialog.value = true;
};

const deleteTask = async () => {
  if (!taskToDelete.value) return;

  try {
    deleting.value = true;
    await taskApi.deleteTask(taskToDelete.value);
    await loadTasks();
    deleteDialog.value = false;
    taskToDelete.value = null;
  } catch (error) {
    console.error("Error deleting task:", error);
  } finally {
    deleting.value = false;
  }
};

const goToCreateTask = () => {
  router.push("/tareas/nueva");
};

const goToUsers = () => router.push("/usuarios");
const goToTasks = () => router.push("/tareas");
const goAddUser = () => router.push("/usuarios/nuevo");
const goAddTask = () => router.push("/tareas/nueva");

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  router.push("/login");
};

const getEstadoColor = (estado: string) => {
  const colors = {
    pendiente: "orange",
    en_progreso: "blue",
    completada: "green",
  };
  return colors[estado as keyof typeof colors] || "grey";
};

const getEstadoVariant = (estado: string) => {
  return estado === "completada" ? "flat" : "tonal";
};

const getEstadoText = (estado: string) => {
  const texts = {
    pendiente: "Pendiente",
    en_progreso: "En Progreso",
    completada: "Completada",
  };
  return texts[estado as keyof typeof texts] || estado;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

onMounted(async () => {
  const raw = localStorage.getItem("user");
  user.value = raw ? (JSON.parse(raw) as User) : null;

  await loadUsers();
  await loadTasks();
});
</script>

<style scoped>
.v-data-table {
  border-radius: 8px;
}

.v-card {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>
