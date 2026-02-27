# L.A. Noire Backend – Implementation Overview

## 1. Project Structure

```
backend/
├── backend/                 # Django project config
│   ├── settings.py          # Main settings
│   ├── urls.py              # Root URL routing
│   ├── wsgi.py
│   └── asgi.py
├── manage.py
├── requirements.txt
├── entrypoint.sh            # Runs migrations, then starts server
├── Dockerfile
├── accounts/                # Auth, users, roles, persons
├── cases/                   # Cases, crime reports, suspects, persons
├── evidence/                # Evidence
├── board/                   # Detective board
├── rewards/                 # Most wanted / under surveillance
├── payments/                # Payments (placeholder)
└── trials/                  # Trials
```

---

## 2. Tech Stack

- **Django 6.0.2**
- **Django REST Framework**
- **djangorestframework-simplejwt** – JWT auth
- **django-cors-headers** – CORS
- **drf-spectacular** – OpenAPI schema
- **drf-yasg** – Swagger UI
- **SQLite** (PostgreSQL via `psycopg2-binary` if needed)

---

## 3. Configuration (`backend/settings.py`)

- **`AUTH_USER_MODEL = 'accounts.User'`** – Custom user model
- **`AUTHENTICATION_BACKENDS`** – Custom backend first, then `ModelBackend`
- **REST Framework** – JWT auth, `IsAuthenticated` by default
- **JWT** – Access 1 day, refresh 7 days
- **CORS** – `CORS_ALLOW_ALL_ORIGINS = True` (dev only)
- **Media** – `/media/` for uploads

---

## 4. URL Layout (`backend/urls.py`)

| Prefix | App | Purpose |
|--------|-----|---------|
| `/admin/` | Django | Admin |
| `/api/accounts/` | accounts | Auth, users, roles, profile |
| `/api/cases/` | cases | Cases, crime reports, persons, suspects |
| `/api/evidence/` | evidence | Evidence |
| `/api/board/` | board | Detective board |
| `/api/trials/` | trials | Trials |
| `/api/rewards/` | rewards | Most wanted |
| `/api/payments/` | payments | Payments |
| `/api/schema/` | drf-spectacular | OpenAPI schema |
| `/api/docs/` | drf-spectacular | Swagger UI |
| `/api/redoc/` | drf-spectacular | ReDoc |

---

## 5. App: `accounts`

### 5.1 Models (`accounts/models.py`)

**`Role`**
- `name`, `description`, `permissions` (JSON)
- Used for RBAC via M2M on `User`

**`User` (extends `AbstractUser`)**
- Extra: `email` (unique), `phone_number`, `national_id`, `profile_picture`
- Police: `badge_number`, `role`, `rank`, `precinct`
- `roles` – M2M to `Role`
- `has_role(role_name)` – checks `role` and `roles`

**`UserRole`**
- Links `User` and `Role` with `assigned_at`

**`Person`**
- `first_name`, `last_name`, `dob`, `aliases`, `contact_info`, `person_type`, `notes`
- `full_name()` – `first_name last_name`
- `compute_hot_pursuit_stats()` – stats for most-wanted ranking

**`Suspect`** (in `accounts.models`, `app_label='cases'`)
- `person`, `case`, `status`, `start_date`, `last_status_update`, `crime_degree`
- Status: `UNDER_PURSUIT`, `HOT_PURSUIT`, `CAPTURED`, `RELEASED`
- `days_under_pursuit` property
- `update_status_if_expired(threshold_days=30)` – auto-upgrade to HOT_PURSUIT

**`CasePerson`**
- `case`, `person`, `role_in_case`, `notes`

### 5.2 Auth Backend (`accounts/backends.py`)

**`EmailPhoneNationalBackend`**
- Login with `username`, `email`, `phone_number`, or `national_id`
- Uses `Q(username=...) | Q(email=...) | Q(phone_number=...) | Q(national_id=...)`

### 5.3 Permissions (`accounts/permissions.py`)

- `_user_has_role(user, role_names)` – checks `User.role` and `User.roles`
- Permission classes:
  - `CanAccessCases` – Cadet, Police Officer, Patrol Officer, Detective, Sergeant, Captain, Chief, Complainant (Base user DENIED)
  - `CanSubmitCrimeReport` – Base user, Cadet, Complainant, and all case roles (submit complaints only)
  - `CanAccessDetectiveBoard` – Detective
  - `CanAccessSurveillance` – Detective, Sergeant, Captain, Chief, Police Officer, Patrol Officer
  - `CanAccessGeneralReport` – Judge, Captain, Chief
  - `CanAccessEvidence` – Detective, Police Officer, Patrol Officer, Coroner, Sergeant, Captain
  - `CanApproveCrimeReports` – Sergeant, Captain, Chief, Detective
  - `IsAdmin` – Administrator, admin

### 5.4 Views (`accounts/views.py`)

| View | URL | Method | Permission | Purpose |
|------|-----|--------|------------|---------|
| `CustomTokenObtainPairView` | `login/` | POST | AllowAny | JWT login (identifier + password) |
| `RegisterView` | `register/` | POST | AllowAny | Register user, assign "Base user" role |
| `ProfileView` | `profile/` | GET, PATCH | IsAuthenticated | Get/update profile |
| `ChangePasswordView` | `change-password/` | POST | IsAuthenticated | Change password |
| `dashboard_stats` | `dashboard/stats/` | GET | IsAuthenticated | Solved cases, employees, active cases |
| `UserViewSet` | `users/` | GET, list/detail | IsAdminUser | User CRUD |
| `UserViewSet.assign_roles` | `users/{id}/assign_roles/` | POST | IsAdminUser | Assign roles |
| `RoleViewSet` | `roles/` | CRUD | IsAdminUser | Role CRUD |

### 5.5 Serializers (`accounts/serializers.py`)

- **`UserSerializer`** – Read profile
- **`ProfileUpdateSerializer`** – Update profile fields
- **`RegisterSerializer`** – Registration, assigns "Base user" role
- **`RoleSerializer`** – Role read/write
- **`CustomTokenObtainPairSerializer`** – Uses `identifier` instead of `username`, returns `user` in response

### 5.6 URLs (`accounts/urls.py`)

- `login/`, `register/`, `profile/`, `change-password/`, `dashboard/stats/`
- Router: `roles/`, `users/`

---

## 6. App: `cases`

### 6.1 Models (`cases/models.py`)

**`Case`**
- `case_number`, `title`, `description`, `status`, `priority`, `precinct`, `opened_at`, `closed_at`, `is_archived`
- Status: new, open, investigation, closed, cold, archived

**`Report`**
- `report_type`, `title`, `content`, `case`, `created_at`

**`CrimeReport`**
- `title`, `description`, `occurred_at`, `location`, `witnesses`, `reporter`, `status`, `assigned_cadet`, `assigned_superior`, `case`
- Status: `pending_superior`, `approved`, `returned`
- On create: assigned to a random cadet for triage
- `approve_by_superior(actor)` – creates `Case`, links it
- `return_to_reporter(actor, reason=...)`
- `log(actor, action, reason, details)` – writes to `AuditLog`

**`Attachment`**
- Generic attachments for case, report, evidence, interrogation

**`AuditLog`**
- `actor_identifier`, `action`, `target_type`, `target_id`, `details`

**`Interrogation`**
- `case`, `suspect`, `start_time`, `end_time`, `location`, `transcript`, `outcome`, `notes`, `attendees`

### 6.2 Views (`cases/views.py`)

| ViewSet | Base URL | Permission | Purpose |
|---------|----------|------------|---------|
| `CaseViewSet` | `/api/cases/` | CanAccessCases | Case CRUD (Base user denied) |
| `CrimeReportViewSet` | `/api/cases/crime-reports/` | CanSubmitCrimeReport | Submit complaints; Base user can create, sees only own; Cadet sees assigned |
| `CrimeReportViewSet.approve` | `crime-reports/{id}/approve/` | CanApproveCrimeReports | Approve report, create case |
| `CrimeReportViewSet.return_report` | `crime-reports/{id}/return_report/` | CanApproveCrimeReports | Return report |

| ViewSet | Base URL | Permission | Purpose |
|---------|----------|------------|---------|
| `PersonViewSet` | `/api/cases/persons/` | CanAccessSurveillance | Person CRUD |
| `SuspectViewSet` | `/api/cases/suspects/` | CanAccessSurveillance | Suspect CRUD |
| `SuspectViewSet.update_status` | `suspects/{id}/update_status/` | CanAccessSurveillance | Update suspect status |

### 6.3 Serializers (`cases/serializers.py`)

- **`CaseSerializer`** – Auto-generates `case_number` on create
- **`CrimeReportSerializer`** – Crime report
- **`PersonSerializer`** – Person
- **`SuspectSerializer`** – Suspect with `person_name`, `case_number`, `days_under_pursuit`

### 6.4 URLs (`cases/urls.py`)

Router: `''` (cases), `crime-reports/`, `persons/`, `suspects/`

---

## 7. App: `evidence`

### 7.1 Models (`evidence/models.py`)

**`Evidence`**
- `title`, `description`, `evidence_type`, `file`, `collected_at`, `chain_of_custody`, `storage_location`, `status`, `case`, `related_report`
- Types: physical, digital, document, photo, video, audio, other
- Status: logged, submitted, returned, released

**`Testimony`** – OneToOne with `Evidence`

**`BiologicalEvidence`** – OneToOne with `Evidence`, coroner review

**`VehicleEvidence`**, **`IdentificationEvidence`**, **`PhysicalEvidence`**, **`DigitalEvidence`**, **`PhotoEvidence`**, **`VideoEvidence`** – OneToOne with `Evidence`

### 7.2 Views (`evidence/views.py`)

- **`EvidenceViewSet`** – Full CRUD, permission `CanAccessEvidence`

### 7.3 Serializers (`evidence/serializers.py`)

- **`EvidenceSerializer`** – Main evidence fields (no nested types)

### 7.4 URLs (`evidence/urls.py`)

- Router: `''` → `/api/evidence/`

---

## 8. App: `board`

### 8.1 Models

**`CaseBoard`**
- OneToOne with `Case`; stores `nodes` and `edges` (JSON) for React Flow board state.

### 8.2 Views (`board/views.py`)

- **`board_overview`** – GET, permission `CanAccessDetectiveBoard`
- Returns open cases for board selection.
- **`case_board_detail`** – GET `/api/board/cases/<uuid>/`
- Returns case, evidences, and saved board state (nodes, edges).
- **`case_board_save`** – PATCH `/api/board/cases/<uuid>/save/`
- Saves board state (nodes, edges) for a case.

### 8.3 URLs (`board/urls.py`)

- `''` → `GET /api/board/`
- `cases/<uuid>/` → `GET /api/board/cases/<uuid>/`
- `cases/<uuid>/save/` → `PATCH /api/board/cases/<uuid>/save/`

---

## 9. App: `rewards`

### 9.1 Models

- No models; uses `Suspect` from `accounts.models`.

### 9.2 Views (`rewards/views.py`)

- **`rewards_list`** – GET, permission `CanAccessSurveillance`
- Returns suspects with status `UNDER_PURSUIT` or `HOT_PURSUIT`
- Uses `Person.compute_hot_pursuit_stats()` for rank and reward.

### 9.3 URLs (`rewards/urls.py`)

- `''` → `GET /api/rewards/`

---

## 10. App: `payments`

### 10.1 Models

- Empty.

### 10.2 Views (`payments/views.py`)

- **`payments_list`** – GET, permission `CanAccessSurveillance`
- Returns `{'items': []}` (placeholder).

### 10.3 URLs (`payments/urls.py`)

- `''` → `GET /api/payments/`

---

## 11. App: `trials`

### 11.1 Models (`trials/models.py`)

**`Trial`**
- `case`, `start_date`, `end_date`, `verdict`, `notes`, `court_room`, `witnesses` (M2M Person)
- Verdict: guilty, not_guilty, mistrial, other

### 11.2 Views (`trials/views.py`)

- **`TrialViewSet`** – Full CRUD, permission `CanAccessGeneralReport`

### 11.3 Serializers (`trials/serializers.py`)

- **`TrialSerializer`** – Includes `case_number` via `SerializerMethodField`

### 11.4 URLs (`trials/urls.py`)

- Router: `''` → `/api/trials/`

---

## 12. Auth Flow

1. **Login** – POST `/api/accounts/login/` with `{ "identifier": "email|phone|username|national_id", "password": "..." }`
2. **Response** – `{ "access", "refresh", "user" }`
3. **Protected requests** – Header: `Authorization: Bearer <access_token>`
4. **Refresh** – POST to SimpleJWT refresh endpoint with `refresh` token.

---

## 13. Role-to-Resource Mapping

| Resource | Permission Code | Roles |
|----------|-----------------|-------|
| Submit Complaint | (CanSubmitCrimeReport) | Base user, Cadet, Complainant, Police Officer, Patrol Officer, Detective, Sergeant, Captain, Chief |
| Cases & Complaints | `cases.access` | Cadet, Police Officer, Patrol Officer, Detective, Sergeant, Captain, Chief, Complainant (Base user cannot view cases) |
| Approve/Return Crime Reports | `cases.approve_reports` | Sergeant, Captain, Chief, Detective |
| Detective Board | `board.access` | Detective |
| Under Surveillance (Most Wanted) | `surveillance.access` | Detective, Sergeant, Captain, Chief, Police Officer, Patrol Officer |
| General Report (Trials) | `general_report.access` | Judge, Captain, Chief |
| Evidence | `evidence.access` | Detective, Police Officer, Patrol Officer, Coroner, Sergeant, Captain |
| Admin | `admin.access` | Administrator, admin |

Permissions are seeded in `0005_seed_role_permissions` and stored in `Role.permissions` (JSON). Use `user.has_role_permission('cases.access')` or `HasRolePermission('cases.access')` for permission checks.

---

## 14. Not Implemented / Placeholder

- **`accounts/admin.py`** – No models registered
- **`payments`** – Empty models, stub view
- **`board`** – No models
- **`rewards`** – No models (uses `Suspect`)
- **Evidence subtypes** – `BiologicalEvidence`, `VehicleEvidence`, etc. exist but are not exposed via API
- **`Report`** – No API
- **`Interrogation`** – No API
- **`Attachment`** – No dedicated API

---

## 15. Running the Backend

**Docker:**
```bash
docker compose up backend
```

**Local:**
```bash
cd backend
python manage.py migrate
python manage.py runserver
```

**Create superuser:**
```bash
docker compose exec backend python manage.py createsuperuser
```

**API docs:**
- Swagger: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`
