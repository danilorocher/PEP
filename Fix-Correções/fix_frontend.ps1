# ==========================================
# PEP+ Frontend - Corrige erros TypeScript
# ==========================================

Write-Host ""
Write-Host "=========================================="
Write-Host "PEP+ Frontend - Corrigindo erros TS"
Write-Host "=========================================="
Write-Host ""

# Validacao
if (!(Test-Path "frontend")) {
    Write-Host "Execute na raiz do projeto (pasta com /frontend)" -ForegroundColor Red
    exit
}

# ==========================================
# CORRECAO 1 - tsconfig.json
# ==========================================
$tsconfigPath = "frontend/tsconfig.json"

if (Test-Path $tsconfigPath) {
    $json = Get-Content $tsconfigPath -Raw | ConvertFrom-Json

    if (-not $json.compilerOptions) {
        $json | Add-Member -Name compilerOptions -Value @{} -MemberType NoteProperty
    }

    if (-not $json.compilerOptions.types) {
        $json.compilerOptions | Add-Member -Name types -Value @("vite/client") -MemberType NoteProperty
    }
    elseif ($json.compilerOptions.types -notcontains "vite/client") {
        $json.compilerOptions.types += "vite/client"
    }

    $json | ConvertTo-Json -Depth 10 | Set-Content -Encoding UTF8 $tsconfigPath
}

Write-Host "1/8 - tsconfig corrigido"

# ==========================================
# CORRECAO 2 - useAuthStore
# ==========================================
@"
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type PermissionsMap = Record<string, Record<string, boolean>>;

interface UserRole {
  id?: string;
  nome?: string;
  permissoes?: PermissionsMap;
}

export interface User {
  id: string;
  name?: string;
  nomeCompleto?: string;
  email?: string;
  role?: string | UserRole;
  roleName?: string;
  mustChangePassword?: boolean;
  permissoes?: PermissionsMap;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  permissions: PermissionsMap;
  setAuth: (user: User, token: string, permissions: PermissionsMap | any) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      permissions: {},
      setAuth: (user, token, permissions) => set({
        user,
        accessToken: token,
        permissions: permissions || {},
      }),
      logout: () => set({ user: null, accessToken: null, permissions: {} }),
      isAuthenticated: () => !!get().accessToken,
    }),
    { name: '@pep-plus/auth' }
  )
);
"@ | Set-Content -Encoding UTF8 "frontend/src/store/useAuthStore.ts"

Write-Host "2/8 - useAuthStore corrigido"

# ==========================================
# CORRECAO 3 - usePermission
# ==========================================
@"
import React from 'react';
import { useAuthStore, User } from '../../store/useAuthStore';

type PermissionsMap = Record<string, Record<string, boolean>>;

function getRoleName(user: User | null): string {
  if (!user) return '';
  if (user.roleName) return user.roleName;
  if (typeof user.role === 'string') return user.role;
  if (typeof user.role === 'object' && user.role?.nome) return user.role.nome;
  return '';
}

function getPermissions(user: User | null, storePermissions: PermissionsMap): PermissionsMap {
  if (storePermissions && Object.keys(storePermissions).length > 0) return storePermissions;
  if (user?.permissoes) return user.permissoes;
  if (typeof user?.role === 'object' && user.role?.permissoes) return user.role.permissoes;
  return {};
}

export const usePermission = (module: string, action: string): boolean => {
  const { permissions, user } = useAuthStore();
  if (getRoleName(user) === 'ADMIN') return true;
  const safePermissions = getPermissions(user, permissions);
  const modulePermissions = safePermissions[module];
  if (!modulePermissions) return false;
  return !!modulePermissions[action];
};

interface CanProps {
  module: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({ module, action, children, fallback = null }) => {
  const hasPermission = usePermission(module, action);
  return hasPermission ? <>{children}</> : <>{fallback}</>;
};
"@ | Set-Content -Encoding UTF8 "frontend/src/shared/hooks/usePermission.tsx"

Write-Host "3/8 - usePermission corrigido"

# ==========================================
# CORRECAO 4 - useState([])
# ==========================================
$files = @(
"frontend/src/modules/attendance/pages/AttendanceList/index.tsx",
"frontend/src/modules/billing/pages/BillingList/index.tsx",
"frontend/src/modules/exams/pages/ExamList/index.tsx",
"frontend/src/modules/medication/pages/MedicationList/index.tsx",
"frontend/src/modules/patients/pages/PatientList/index.tsx",
"frontend/src/modules/professionals/pages/ProfessionalList/index.tsx",
"frontend/src/modules/scheduling/pages/Scheduling/index.tsx",
"frontend/src/modules/structure/pages/StructureList/index.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        (Get-Content $file) -replace "useState\(\[\]\)", "useState<any[]>([])" | Set-Content -Encoding UTF8 $file
    }
}

Write-Host "4/8 - useState corrigido"

# ==========================================
# CORRECAO 5 - Typography size
# ==========================================
$textFiles = @(
"frontend/src/modules/billing/pages/BillingList/index.tsx",
"frontend/src/modules/dashboard/components/DashboardStats/index.tsx",
"frontend/src/modules/hospitalizations/pages/HospitalizationList/index.tsx",
"frontend/src/modules/medication/pages/MedicationList/index.tsx",
"frontend/src/shared/components/Header/index.tsx"
)

foreach ($file in $textFiles) {
    if (Test-Path $file) {
        (Get-Content $file) `
        -replace ' size="small"', ' style={{ fontSize: "12px" }}' `
        -replace ' size="large"', ' style={{ fontSize: "16px" }}' |
        Set-Content -Encoding UTF8 $file
    }
}

Write-Host "5/8 - Typography corrigido"

# ==========================================
# CORRECAO 6 - Dashboard Text
# ==========================================
$dashboard = "frontend/src/modules/dashboard/pages/Dashboard/index.tsx"

if (Test-Path $dashboard) {
    (Get-Content $dashboard) `
    -replace "const { Title, Text } = Typography;", "const { Title } = Typography;" `
    -replace "<Text ", "<Typography.Text " `
    -replace "</Text>", "</Typography.Text>" |
    Set-Content -Encoding UTF8 $dashboard
}

Write-Host "6/8 - Dashboard corrigido"

# ==========================================
# CORRECAO 7 - StructureList
# ==========================================
$structure = "frontend/src/modules/structure/pages/StructureList/index.tsx"

if (Test-Path $structure) {
    (Get-Content $structure) `
    -replace "import { Table, Button", "import { Table, Button, message" |
    Set-Content -Encoding UTF8 $structure
}

Write-Host "7/8 - StructureList corrigido"

# ==========================================
# CORRECAO 8 - Diversos
# ==========================================
$reports = "frontend/src/modules/reports/pages/Reports/index.tsx"

if (Test-Path $reports) {
    (Get-Content $reports) `
    -replace "NodeJS.Timeout", "ReturnType<typeof setInterval>" |
    Set-Content -Encoding UTF8 $reports
}

Write-Host "8/8 - Ajustes finais aplicados"

# ==========================================
# VERIFICACAO FINAL
# ==========================================
Write-Host ""
Write-Host "=========================================="
Write-Host "Verificando erros TS..."
Write-Host "=========================================="

cd frontend
npx tsc --noEmit

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCESSO - 0 erros TypeScript" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Ainda existem erros" -ForegroundColor Yellow
}