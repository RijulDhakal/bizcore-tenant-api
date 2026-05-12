export type Permission = 
  | 'dashboard.owner'
  | 'dashboard.finance'
  | 'dashboard.hr'
  | 'dashboard.sales'
  | 'dashboard.pos'
  | 'khata.view'
  | 'khata.create'
  | 'expenses.view'
  | 'expenses.create'
  | 'reports.view'
  | 'invoices.view'
  | 'invoices.create'
  | 'pos.access'
  | 'hr.view'
  | 'hr.manage'
  | 'self.work'
  | 'attendance.view'
  | 'leaves.manage'
  | 'payroll.manage'
  | 'inventory.view'
  | 'inventory.edit'
  | 'purchase.view'
  | 'projects.view'
  | 'settings.view'
  | 'team.manage'
  | 'partners.view';

export const ROLE_PERMISSIONS: Record<number, Permission[]> = {
  0: ['*'] as any, // SuperAdmin
  5: ['*'] as any, // Owner
  1: [ // Admin
    'dashboard.owner',
    'self.work',
    'khata.view',
    'khata.create',
    'expenses.view',
    'expenses.create',
    'invoices.view',
    'invoices.create',
    'pos.access',
    'inventory.view',
    'inventory.edit',
    'purchase.view',
    'hr.view',
    'hr.manage',
    'attendance.view',
    'leaves.manage',
    'payroll.manage',
    'partners.view',
    'projects.view'
  ],

  2: [ // Accountant
    'dashboard.finance',
    'self.work',
    'khata.view',
    'expenses.view',
    'expenses.create',
    'reports.view'
  ],

  3: [ // Sales
    'dashboard.sales',
    'self.work',
    'invoices.view',
    'invoices.create',
    'partners.view'
  ],

  4: [ // POS Operator
    'dashboard.pos',
    'self.work',
    'pos.access'
  ],

  6: [ // HR Manager
    'dashboard.hr',
    'self.work',
    'hr.view',
    'hr.manage',
    'attendance.view',
    'leaves.manage',
    'payroll.manage'
  ]
};
