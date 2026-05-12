# Tenant App (BizCore) — EF Core Migrations Inventory

Source folder: `BizCore.Infrastructure/Data/Migrations`

This is an inventory of **all** Entity Framework Core migration artifacts currently present in the Tenant App codebase at `/Users/rijul/Documents/bizcore`.

## Summary

- Migrations directory: `BizCore.Infrastructure/Data/Migrations`
- Total migration classes: **22**
- Snapshot: `AppDbContextModelSnapshot.cs`

> Note: A search like `find ... -name "*Migration*.cs"` returns no results because your migration files are named like `2026..._Name.cs` (they don’t contain the substring `Migration`).

## Snapshot

- [BizCore.Infrastructure/Data/Migrations/AppDbContextModelSnapshot.cs](BizCore.Infrastructure/Data/Migrations/AppDbContextModelSnapshot.cs)

## Migrations (in folder order)

Most migrations have two files:
- `YYYYMMDDHHMMSS_Name.cs`
- `YYYYMMDDHHMMSS_Name.Designer.cs`

One migration in this folder currently has **no** `.Designer.cs` artifact present: `20260416120000_AddSubscriptionTables.cs`.

### 20260315080438_Initial
- [BizCore.Infrastructure/Data/Migrations/20260315080438_Initial.cs](BizCore.Infrastructure/Data/Migrations/20260315080438_Initial.cs)
- [BizCore.Infrastructure/Data/Migrations/20260315080438_Initial.Designer.cs](BizCore.Infrastructure/Data/Migrations/20260315080438_Initial.Designer.cs)

### 20260315101504_Phase2_Inventory_Purchase_POS
- [BizCore.Infrastructure/Data/Migrations/20260315101504_Phase2_Inventory_Purchase_POS.cs](BizCore.Infrastructure/Data/Migrations/20260315101504_Phase2_Inventory_Purchase_POS.cs)
- [BizCore.Infrastructure/Data/Migrations/20260315101504_Phase2_Inventory_Purchase_POS.Designer.cs](BizCore.Infrastructure/Data/Migrations/20260315101504_Phase2_Inventory_Purchase_POS.Designer.cs)

### 20260315133953_UpdateBusiness_Nepal
- [BizCore.Infrastructure/Data/Migrations/20260315133953_UpdateBusiness_Nepal.cs](BizCore.Infrastructure/Data/Migrations/20260315133953_UpdateBusiness_Nepal.cs)
- [BizCore.Infrastructure/Data/Migrations/20260315133953_UpdateBusiness_Nepal.Designer.cs](BizCore.Infrastructure/Data/Migrations/20260315133953_UpdateBusiness_Nepal.Designer.cs)

### 20260315174610_Phase3_HR_Projects
- [BizCore.Infrastructure/Data/Migrations/20260315174610_Phase3_HR_Projects.cs](BizCore.Infrastructure/Data/Migrations/20260315174610_Phase3_HR_Projects.cs)
- [BizCore.Infrastructure/Data/Migrations/20260315174610_Phase3_HR_Projects.Designer.cs](BizCore.Infrastructure/Data/Migrations/20260315174610_Phase3_HR_Projects.Designer.cs)

### 20260317060017_AddContactFields
- [BizCore.Infrastructure/Data/Migrations/20260317060017_AddContactFields.cs](BizCore.Infrastructure/Data/Migrations/20260317060017_AddContactFields.cs)
- [BizCore.Infrastructure/Data/Migrations/20260317060017_AddContactFields.Designer.cs](BizCore.Infrastructure/Data/Migrations/20260317060017_AddContactFields.Designer.cs)

### 20260317060033_AddKhataEntryFields
- [BizCore.Infrastructure/Data/Migrations/20260317060033_AddKhataEntryFields.cs](BizCore.Infrastructure/Data/Migrations/20260317060033_AddKhataEntryFields.cs)
- [BizCore.Infrastructure/Data/Migrations/20260317060033_AddKhataEntryFields.Designer.cs](BizCore.Infrastructure/Data/Migrations/20260317060033_AddKhataEntryFields.Designer.cs)

### 20260317060046_AddEmployeeNepalFields
- [BizCore.Infrastructure/Data/Migrations/20260317060046_AddEmployeeNepalFields.cs](BizCore.Infrastructure/Data/Migrations/20260317060046_AddEmployeeNepalFields.cs)
- [BizCore.Infrastructure/Data/Migrations/20260317060046_AddEmployeeNepalFields.Designer.cs](BizCore.Infrastructure/Data/Migrations/20260317060046_AddEmployeeNepalFields.Designer.cs)

### 20260318011252_AddExpenseModule
- [BizCore.Infrastructure/Data/Migrations/20260318011252_AddExpenseModule.cs](BizCore.Infrastructure/Data/Migrations/20260318011252_AddExpenseModule.cs)
- [BizCore.Infrastructure/Data/Migrations/20260318011252_AddExpenseModule.Designer.cs](BizCore.Infrastructure/Data/Migrations/20260318011252_AddExpenseModule.Designer.cs)

### 20260318011257_AddBankingModule
- [BizCore.Infrastructure/Data/Migrations/20260318011257_AddBankingModule.cs](BizCore.Infrastructure/Data/Migrations/20260318011257_AddBankingModule.cs)
- [BizCore.Infrastructure/Data/Migrations/20260318011257_AddBankingModule.Designer.cs](BizCore.Infrastructure/Data/Migrations/20260318011257_AddBankingModule.Designer.cs)

### 20260318103740_AddLoginHistoryAndAuditLog
- [BizCore.Infrastructure/Data/Migrations/20260318103740_AddLoginHistoryAndAuditLog.cs](BizCore.Infrastructure/Data/Migrations/20260318103740_AddLoginHistoryAndAuditLog.cs)
- [BizCore.Infrastructure/Data/Migrations/20260318103740_AddLoginHistoryAndAuditLog.Designer.cs](BizCore.Infrastructure/Data/Migrations/20260318103740_AddLoginHistoryAndAuditLog.Designer.cs)

### 20260326090038_ModularUpdate
- [BizCore.Infrastructure/Data/Migrations/20260326090038_ModularUpdate.cs](BizCore.Infrastructure/Data/Migrations/20260326090038_ModularUpdate.cs)
- [BizCore.Infrastructure/Data/Migrations/20260326090038_ModularUpdate.Designer.cs](BizCore.Infrastructure/Data/Migrations/20260326090038_ModularUpdate.Designer.cs)

### 20260326092404_AddModuleCoreFlag
- [BizCore.Infrastructure/Data/Migrations/20260326092404_AddModuleCoreFlag.cs](BizCore.Infrastructure/Data/Migrations/20260326092404_AddModuleCoreFlag.cs)
- [BizCore.Infrastructure/Data/Migrations/20260326092404_AddModuleCoreFlag.Designer.cs](BizCore.Infrastructure/Data/Migrations/20260326092404_AddModuleCoreFlag.Designer.cs)

### 20260326112542_AddUserFirstLoginFlag
- [BizCore.Infrastructure/Data/Migrations/20260326112542_AddUserFirstLoginFlag.cs](BizCore.Infrastructure/Data/Migrations/20260326112542_AddUserFirstLoginFlag.cs)
- [BizCore.Infrastructure/Data/Migrations/20260326112542_AddUserFirstLoginFlag.Designer.cs](BizCore.Infrastructure/Data/Migrations/20260326112542_AddUserFirstLoginFlag.Designer.cs)

### 20260416120000_AddSubscriptionTables
- [BizCore.Infrastructure/Data/Migrations/20260416120000_AddSubscriptionTables.cs](BizCore.Infrastructure/Data/Migrations/20260416120000_AddSubscriptionTables.cs)

> Note: No corresponding `.Designer.cs` file exists in this folder for this migration.

### 20260417144902_FixWarehouseStockRelationships
- [BizCore.Infrastructure/Data/Migrations/20260417144902_FixWarehouseStockRelationships.cs](BizCore.Infrastructure/Data/Migrations/20260417144902_FixWarehouseStockRelationships.cs)
- [BizCore.Infrastructure/Data/Migrations/20260417144902_FixWarehouseStockRelationships.Designer.cs](BizCore.Infrastructure/Data/Migrations/20260417144902_FixWarehouseStockRelationships.Designer.cs)

### 20260423182157_UpdateSubscriptionPlanFlags_Fixed
- [BizCore.Infrastructure/Data/Migrations/20260423182157_UpdateSubscriptionPlanFlags_Fixed.cs](BizCore.Infrastructure/Data/Migrations/20260423182157_UpdateSubscriptionPlanFlags_Fixed.cs)
- [BizCore.Infrastructure/Data/Migrations/20260423182157_UpdateSubscriptionPlanFlags_Fixed.Designer.cs](BizCore.Infrastructure/Data/Migrations/20260423182157_UpdateSubscriptionPlanFlags_Fixed.Designer.cs)

### 20260424035632_AddTrialAndSubAddons
- [BizCore.Infrastructure/Data/Migrations/20260424035632_AddTrialAndSubAddons.cs](BizCore.Infrastructure/Data/Migrations/20260424035632_AddTrialAndSubAddons.cs)
- [BizCore.Infrastructure/Data/Migrations/20260424035632_AddTrialAndSubAddons.Designer.cs](BizCore.Infrastructure/Data/Migrations/20260424035632_AddTrialAndSubAddons.Designer.cs)

### 20260424212734_AddMissingAdminColumns
- [BizCore.Infrastructure/Data/Migrations/20260424212734_AddMissingAdminColumns.cs](BizCore.Infrastructure/Data/Migrations/20260424212734_AddMissingAdminColumns.cs)
- [BizCore.Infrastructure/Data/Migrations/20260424212734_AddMissingAdminColumns.Designer.cs](BizCore.Infrastructure/Data/Migrations/20260424212734_AddMissingAdminColumns.Designer.cs)

### 20260425073239_AddOnboardingFields
- [BizCore.Infrastructure/Data/Migrations/20260425073239_AddOnboardingFields.cs](BizCore.Infrastructure/Data/Migrations/20260425073239_AddOnboardingFields.cs)
- [BizCore.Infrastructure/Data/Migrations/20260425073239_AddOnboardingFields.Designer.cs](BizCore.Infrastructure/Data/Migrations/20260425073239_AddOnboardingFields.Designer.cs)

### 20260425083235_SimplifyBusinessFields
- [BizCore.Infrastructure/Data/Migrations/20260425083235_SimplifyBusinessFields.cs](BizCore.Infrastructure/Data/Migrations/20260425083235_SimplifyBusinessFields.cs)
- [BizCore.Infrastructure/Data/Migrations/20260425083235_SimplifyBusinessFields.Designer.cs](BizCore.Infrastructure/Data/Migrations/20260425083235_SimplifyBusinessFields.Designer.cs)

### 20260425130825_SyncSchema
- [BizCore.Infrastructure/Data/Migrations/20260425130825_SyncSchema.cs](BizCore.Infrastructure/Data/Migrations/20260425130825_SyncSchema.cs)
- [BizCore.Infrastructure/Data/Migrations/20260425130825_SyncSchema.Designer.cs](BizCore.Infrastructure/Data/Migrations/20260425130825_SyncSchema.Designer.cs)

### 20260425132406_AddMissingOwnerFields
- [BizCore.Infrastructure/Data/Migrations/20260425132406_AddMissingOwnerFields.cs](BizCore.Infrastructure/Data/Migrations/20260425132406_AddMissingOwnerFields.cs)
- [BizCore.Infrastructure/Data/Migrations/20260425132406_AddMissingOwnerFields.Designer.cs](BizCore.Infrastructure/Data/Migrations/20260425132406_AddMissingOwnerFields.Designer.cs)
