# Sistem Kontrol Kualitas Crowd Worker Menggunakan Algoritma M-X

## 1. Landasan Teori

### 1.1 Crowdsourcing dan Quality Control

Crowdsourcing adalah praktik mendapatkan input atau layanan dari sekelompok besar orang, terutama melalui platform online. Dalam konteks pengumpulan data, quality control menjadi aspek kritis karena tidak semua kontributor memiliki tingkat keahlian atau motivasi yang sama.

### 1.2 Algoritma M-X

Algoritma M-X adalah metode probabilistik yang dikembangkan untuk mengestimasi akurasi pekerja dalam tugas multiple choice tanpa memerlukan ground truth. Algoritma ini bekerja dengan prinsip:

1. **Konversi Multiple Choice ke Binary**: Setiap soal multiple choice dengan M pilihan dikonversi menjadi M sub-pertanyaan binary
2. **Sliding Window Analysis**: Menggunakan jendela geser 3 pekerja untuk analisis statistik yang robust
3. **M-1 Algorithm Application**: Menerapkan algoritma M-1 pada setiap sub-pertanyaan binary
4. **Product Formula**: Menghitung akurasi komprehensif menggunakan rumus: Ai = ∏(j=1 to M) Aij

### 1.3 Rumus Matematika

Algoritma M-X mengimplementasikan rumus agreement probability:
```
Qij = Ai·Aj + (1/(M+1))·(1-Ai)·(1-Aj)·(M-1)
```

Dimana:
- Qij = probabilitas agreement antara pekerja i dan j
- Ai, Aj = akurasi pekerja i dan j
- M = jumlah pilihan jawaban

## 2. Metodologi

### 2.1 Arsitektur Sistem

Sistem ini dibangun menggunakan arsitektur modular dengan komponen utama:

#### 2.1.1 Backend Framework
- **NestJS**: Framework Node.js yang menyediakan struktur modular dan dependency injection
- **GraphQL**: Query language untuk API yang fleksibel dan type-safe
- **MongoDB**: Database NoSQL untuk penyimpanan data yang scalable

#### 2.1.2 Struktur Modul

```
src/
├── auth/           # Modul autentikasi dan otorisasi
├── users/          # Manajemen data pengguna dan pekerja
├── tasks/          # Manajemen tugas dan soal
├── MX/             # Implementasi algoritma M-X dan analisis
└── config/         # Konfigurasi sistem
```

### 2.2 Model Data

#### 2.2.1 User Model
```typescript
class Users {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role; // admin, worker, company_representative, question_validator
  isEligible: boolean | null; // Status kelayakan berdasarkan M-X
  completedTasks: TaskCompletion[]; // Riwayat penyelesaian tugas
}
```

#### 2.2.2 Task Model
```typescript
class Task {
  _id: string;
  title: string;
  question: GherkinsQuestion; // Soal dalam format Gherkins
  isValidQuestion: boolean;
  nAnswers: number; // Jumlah pilihan jawaban (M)
  answers: Answer[]; // Array pilihan jawaban
}
```

#### 2.2.3 Eligibility Model
```typescript
class Eligibility {
  taskId: string;
  workerId: string;
  accuracy: number; // Hasil perhitungan akurasi M-X
}
```

### 2.3 Implementasi Algoritma M-X

#### 2.3.1 Kelas AccuracyCalculationServiceMX

Kelas ini merupakan inti implementasi algoritma M-X dengan fungsi utama:

1. **processWorkerSubmission()**: Entry point untuk memproses submission pekerja
2. **calculateAccuracyMX()**: Implementasi core algoritma M-X
3. **calculateMXAccuracyForWindow()**: Perhitungan akurasi untuk window 3 pekerja
4. **processBatch()**: Batch processing untuk efisiensi sistem

#### 2.3.2 Alur Kerja Algoritma

```typescript
async processWorkerSubmission(taskId: string, workerId: string) {
  // 1. Validasi pekerja telah menyelesaikan semua tugas
  // 2. Cek apakah cukup pekerja (≥3) untuk kalkulasi M-X
  // 3. Trigger batch processing atau set status pending
  // 4. Buat eligibility records dengan akurasi terhitung
}
```

#### 2.3.3 Sliding Window Implementation

```typescript
// Circular sliding windows untuk analisis komprehensif
for (let j = 0; j < numWindows; j++) {
  const windowWorkers = [
    workers[(i + j) % workers.length],
    workers[(i + j + 1) % workers.length], 
    workers[(i + j + 2) % workers.length]
  ];
  // Kalkulasi akurasi untuk window ini
}
```

### 2.4 Sistem Batch Processing

Sistem mengimplementasikan batch processing untuk optimasi performa:

1. **BatchTracker**: Melacak status processing per task
2. **Threshold Calculation**: Perhitungan dinamis threshold berdasarkan distribusi akurasi
3. **Eligibility Status Management**: Otomatis update status kelayakan pekerja

## 3. Fitur Sistem

### 3.1 Manajemen Pengguna

- **Role-based Access Control**: Admin, Worker, Company Representative, Question Validator
- **JWT Authentication**: Sistem autentikasi yang aman dengan refresh token
- **Profile Management**: Manajemen data profil pengguna yang komprehensif

### 3.2 Manajemen Tugas

- **Task Creation**: Interface untuk membuat tugas dengan format Gherkins
- **Question Validation**: Validasi otomatis format dan struktur soal
- **Multiple Choice Support**: Dukungan untuk soal dengan jumlah pilihan variabel

### 3.3 Monitoring dan Analytics

#### 3.3.1 Dashboard Service
```typescript
class DashboardService {
  getDashboardSummary(): Promise<DashboardSummary>
  getWorkerEligibilityDistribution(): Promise<StatusDistribution[]>
  getAccuracyDistribution(): Promise<AccuracyDistribution[]>
}
```

#### 3.3.2 Worker Analysis Service
```typescript
class WorkerAnalysisService {
  getAlgorithmPerformance(): Promise<AlgorithmPerformanceData[]>
  updateWorkerEligibility(workerId: string): Promise<void>
  updateAllWorkerEligibility(): Promise<boolean>
}
```

### 3.4 API GraphQL

Sistem menyediakan API GraphQL yang komprehensif:

#### 3.4.1 Mutations
- `submitAnswer`: Submit jawaban pekerja
- `createTask`: Membuat tugas baru  
- `updateUserProfile`: Update profil pengguna
- `triggerManualMXProcessing`: Trigger manual proses M-X

#### 3.4.2 Queries
- `getTasks`: Ambil daftar tugas
- `getUsers`: Ambil data pengguna
- `getEligibilityHistory`: Ambil riwayat eligibility
- `getDashboardSummary`: Ambil summary dashboard

## 4. Implementasi Teknis

### 4.1 Error Handling

Sistem menggunakan custom GraphQL error handling:

```typescript
// libs/gqlerr/src/type.ts
export enum GQLThrowType {
  UNEXPECTED = 'UNEXPECTED',
  NOT_FOUND = 'NOT_FOUND', 
  UNAUTHORIZED = 'UNAUTHORIZED',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}
```

### 4.2 Validation dan Security

- **Class Validator**: Validasi input data otomatis
- **JWT Strategy**: Implementasi Passport JWT untuk autentikasi
- **Role Guards**: Proteksi endpoint berdasarkan role pengguna
- **Rate Limiting**: Throttling untuk mencegah abuse

### 4.3 Database Design

#### 4.3.1 Indexing Strategy
```typescript
// Optimized indexing untuk performa query
TaskSchema.index({ title: 1, isValidQuestion: 1 });
UsersSchema.index({ email: 1, role: 1 });
EligibilitySchema.index({ workerId: 1, taskId: 1 });
```

#### 4.3.2 Aggregation Pipelines
```typescript
// Complex aggregation untuk analisis data
const workerEligibilities = await this.eligibilityModel.aggregate([
  { $group: { _id: '$workerId', averageAccuracy: { $avg: '$accuracy' } } },
  { $lookup: { from: 'users', localField: '_id', foreignField: '_id' } }
]);
```

## 5. Hasil dan Pembahasan

### 5.1 Performa Algoritma M-X

Implementasi algoritma M-X menunjukkan karakteristik:

1. **Minimum Worker Requirement**: Memerlukan minimal 3 pekerja untuk kalkulasi yang valid
2. **Sliding Window Efficiency**: Setiap pekerja dievaluasi dalam multiple windows untuk akurasi tinggi
3. **Binary Conversion Accuracy**: Konversi multiple choice ke binary sub-questions meningkatkan presisi

### 5.2 Scalability

Sistem dirancang untuk scalability dengan:

1. **Batch Processing**: Mengurangi load database dengan batch operations
2. **Caching Strategy**: Implementasi cache untuk query yang frequent
3. **Asynchronous Processing**: Non-blocking operations untuk user experience yang optimal

### 5.3 Threshold Management

Sistem mengimplementasikan dynamic threshold calculation:

```typescript
calculateWeightedThreshold(eligibilityRecords: any[]): number {
  // Kalkulasi threshold berdasarkan distribusi akurasi pekerja
  // Menggunakan percentile dan statistical methods
}
```

## 6. Deployment dan Konfigurasi

### 6.1 Environment Variables

```env
MONGO_CONNECTION=mongodb://localhost:27017
MONGO_DB_NAME=crowd-worker-control
JWT_SECRET=your-jwt-secret
PORT=3000
```

### 6.2 Vercel Deployment

Sistem dikonfigurasi untuk deployment di Vercel:

```json
// vercel.json
{
  "builds": [{ "src": "dist/main.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "dist/main.js" }]
}
```

### 6.3 Build Scripts

```json
{
  "scripts": {
    "build": "nest build && npm run build:gqlerr",
    "start": "nest start",
    "dev": "nest start --watch"
  }
}
```

## 7. Testing

### 7.1 Unit Testing

```typescript
// Contoh test untuk MX calculation service
describe('AccuracyCalculationServiceMX', () => {
  it('should calculate accuracy correctly for 3 workers', async () => {
    const result = await service.calculateAccuracyMX(taskId, workerIds);
    expect(result).toBeDefined();
    expect(Object.keys(result)).toHaveLength(3);
  });
});
```

### 7.2 E2E Testing

```bash
npm run test:e2e
```

## 8. Kontribusi Akademis

### 8.1 Inovasi Teknis

1. **Modular M-X Implementation**: Implementasi modular algoritma M-X yang dapat digunakan kembali
2. **Real-time Processing**: Sistem real-time untuk processing submission pekerja
3. **Dynamic Threshold**: Algoritma threshold dinamis berdasarkan distribusi data

### 8.2 Aplikasi Praktis

1. **Industry Application**: Dapat diterapkan untuk quality control dalam industri crowdsourcing
2. **Research Platform**: Menyediakan platform untuk penelitian lanjutan dalam bidang crowdsourcing
3. **Educational Tool**: Dapat digunakan sebagai alat pembelajaran untuk algoritma probabilistik dan quality control

## 9. Kesimpulan

Sistem crowd worker control ini berhasil mengimplementasikan algoritma M-X untuk evaluasi akurasi pekerja dengan fitur-fitur:

1. **Implementasi M-X yang Robust**: Algoritma M-X terimplementasi sesuai dengan spesifikasi akademis
2. **Sistem Manajemen Komprehensif**: Platform lengkap untuk manajemen tugas dan pekerja
3. **Scalable Architecture**: Arsitektur yang dapat di-scale untuk kebutuhan enterprise
4. **Real-time Analytics**: Dashboard dan analytics untuk monitoring performa

## 10. Daftar Queries dan Mutations

### 10.1 GraphQL Mutations

#### Auth & User Management
```graphql
# Autentikasi pengguna
login(input: LoginInput!): AuthView!

# Registrasi pengguna baru
register(input: CreateUserInput!): Users!

# Update profil pengguna
updateUserProfile(input: UpdateUserInput!): Users!

# Qualify semua pengguna (admin only)
qualifyAllUsers: Boolean!
```

#### Task Management
```graphql
# Membuat tugas baru
createTask(input: CreateTaskInput!): Task!

# Update tugas yang ada
updateTask(id: String!, input: UpdateTaskInput!): Task!

# Hapus tugas
deleteTask(id: String!): Boolean!
```

#### Worker Submissions & M-X Processing
```graphql
# Submit jawaban pekerja
submitAnswer(input: CreateRecordedAnswerInput!): Boolean!

# Trigger manual processing M-X
triggerManualMXProcessing: String!

# Reset batch tracker untuk task tertentu
resetBatchTracker(taskId: String!): Boolean!

# Trigger batch processing untuk worker tertentu
triggerBatchProcessing(taskId: String!, workerId: String!): Boolean!

# Update eligibility untuk semua worker
triggerEligibilityUpdate: String!

# Fix masalah eligibility
fixEligibilityIssue: String!
```

#### Utilities & Admin
```graphql
# Clean/reset utilitas sistem
cleanUtils: String!

# Debug masalah eligibility
debugEligibilityIssue: String!
```

### 10.2 GraphQL Queries

#### User & Worker Data
```graphql
# Ambil semua pengguna
getUsers: [Users!]!

# Ambil pengguna berdasarkan ID
getUserById(id: String!): Users!

# Ambil pengguna berdasarkan criteria
getUsersWithArgs(args: GetUserArgs!): [Users!]!

# Ambil profil pengguna yang sedang login
getProfile: Users!
```

#### Task Data
```graphql
# Ambil semua tugas
getTasks: [Task!]!

# Ambil tugas berdasarkan ID
getTaskById(id: String!): Task!

# Ambil tugas berdasarkan criteria
getTasksWithArgs(args: GetTaskArgs!): [Task!]!
```

#### Eligibility & Analytics
```graphql
# Ambil riwayat eligibility untuk worker
getEligibilityHistory(workerId: String!): [EligibilityView!]!

# Ambil semua data eligibility (admin)
getEligibility: [EligibilityView!]!

# Ambil analisis worker performance
getWorkerAnalysis: WorkerAnalysisView!

# Ambil data analisis worker berdasarkan tipe
getWorkerAnalysisData(analysisType: String!): [WorkerAnalysisDataPoint!]!

# Ambil performance algoritma
getAlgorithmPerformance: [AlgorithmPerformanceData!]!
```

#### Dashboard & Monitoring
```graphql
# Ambil summary dashboard
getDashboardSummary: DashboardSummary!

# Ambil distribusi eligibility worker
getWorkerEligibilityDistribution: [StatusDistribution!]!

# Ambil distribusi akurasi
getAccuracyDistribution: [AccuracyDistribution!]!
```

#### System Status & Debugging
```graphql
# Ambil status batch tracker
getBatchStatus(taskId: String!): String!

# Ambil statistik utilitas sistem
getUtilsStats: String!

# Health check sistem
healthCheck: String!
```

---

## Setup dan Instalasi

### Prasyarat

- Node.js (v18 atau lebih tinggi)
- MongoDB (v5.0 atau lebih tinggi)
- npm atau yarn

### Langkah Instalasi

1. **Clone repository**
   ```bash
   git clone https://github.com/satriadhm/crowd-worker-control.git
   cd crowd-worker-control
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env file dengan konfigurasi yang sesuai
   ```

4. **Build aplikasi**
   ```bash
   npm run build
   ```

5. **Jalankan aplikasi**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm run start:prod
   ```

### Akses Aplikasi

- **GraphQL Playground**: `http://localhost:3000/graphql`
- **API Endpoint**: `http://localhost:3000`

---

**Lisensi**: Proyek ini dikembangkan untuk keperluan akademis sebagai bagian dari Tugas Akhir di Telkom University.

**Penulis**: Glorious Satria Dhamang Aji
**NIM**: 1302213015
**Program Studi**: S1 Rekayasa Perangkat Lunak  
**Universitas**: Telkom University  
**Tahun**: 2025
