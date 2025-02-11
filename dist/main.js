/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./libs/gqlerr/src/index.ts":
/*!**********************************!*\
  !*** ./libs/gqlerr/src/index.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CustomGraphQLErrorFilter = exports.ThrowGQL = void 0;
exports.GQLErrFormatter = GQLErrFormatter;
exports.Try = Try;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const type_1 = __webpack_require__(/*! ./type */ "./libs/gqlerr/src/type.ts");
__exportStar(__webpack_require__(/*! ./type */ "./libs/gqlerr/src/type.ts"), exports);
function GQLErrFormatter(err, anyErr) {
    delete err.extensions['code'];
    delete err.extensions['originalError'];
    delete err.extensions['stacktrace'];
    return err;
}
class ThrowGQL extends common_1.BadRequestException {
    constructor(message, type) {
        const options = { type };
        super(message, options);
        this.type = type;
        this.map = type_1.CThrowType[type];
    }
}
exports.ThrowGQL = ThrowGQL;
let CustomGraphQLErrorFilter = class CustomGraphQLErrorFilter {
    async catch(exception, host) {
        if (exception instanceof ThrowGQL) {
            const type = exception.type;
            const customMessage = exception.message;
            const map = exception.map;
            const newException = new common_1.BadRequestException(customMessage);
            delete newException['extensions'];
            newException['extensions'] = {
                type,
                map,
            };
            delete newException['originalError'];
            return newException;
        }
        const translatedMessage = 'Unhandled/Generic Error, please check';
        const newException = new common_1.BadRequestException(translatedMessage);
        return newException;
    }
};
exports.CustomGraphQLErrorFilter = CustomGraphQLErrorFilter;
exports.CustomGraphQLErrorFilter = CustomGraphQLErrorFilter = __decorate([
    (0, common_1.Catch)(common_1.BadRequestException)
], CustomGraphQLErrorFilter);
class CheckResult {
    constructor(result, error) {
        this.result = result;
        this.error = error;
    }
    err(errorMessage, errorType) {
        if (this.error !== null) {
            throw new ThrowGQL(errorMessage, errorType);
        }
        return this.result;
    }
}
function Try(fn) {
    try {
        const result = fn();
        return new CheckResult(result, null);
    }
    catch (error) {
        return new CheckResult(null, error);
    }
}


/***/ }),

/***/ "./libs/gqlerr/src/type.ts":
/*!*********************************!*\
  !*** ./libs/gqlerr/src/type.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CThrowType = exports.GQLThrowType = void 0;
var GQLThrowType;
(function (GQLThrowType) {
    GQLThrowType["NOT_FOUND"] = "NOT_FOUND";
    GQLThrowType["INVALID"] = "INVALID";
    GQLThrowType["NOT_AUTHORIZED"] = "NOT_AUTHORIZED";
    GQLThrowType["UNEXPECTED"] = "UNEXPECTED";
    GQLThrowType["DUPLICATE"] = "DUPLICATE";
    GQLThrowType["FORBIDDEN"] = "FORBIDDEN";
    GQLThrowType["BAD_REQUEST"] = "BAD_REQUEST";
    GQLThrowType["UNPROCESSABLE"] = "UNPROCESSABLE";
    GQLThrowType["INTERNAL"] = "INTERNAL";
    GQLThrowType["ALREADY_JOIN"] = "ALREADY_JOINED";
})(GQLThrowType || (exports.GQLThrowType = GQLThrowType = {}));
exports.CThrowType = {
    NOT_FOUND: 'AT-404',
    INVALID: 'AT-400',
    NOT_AUTHORIZED: 'AT-401',
    UNEXPECTED: 'AT-500',
    DUPLICATE: 'AT-409',
    FORBIDDEN: 'AT-403',
    BAD_REQUEST: 'AT-400',
    UNPROCESSABLE: 'AT-422',
    INTERNAL: 'AT-500',
    ALREADY_JOINED: 'AT-304',
};


/***/ }),

/***/ "./src/M1/m1.module.ts":
/*!*****************************!*\
  !*** ./src/M1/m1.module.ts ***!
  \*****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.M1Module = void 0;
const tasks_module_1 = __webpack_require__(/*! ./../tasks/tasks.module */ "./src/tasks/tasks.module.ts");
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const mongoose_1 = __webpack_require__(/*! @nestjs/mongoose */ "@nestjs/mongoose");
const m1_resolver_1 = __webpack_require__(/*! ./m1.resolver */ "./src/M1/m1.resolver.ts");
const task_1 = __webpack_require__(/*! src/tasks/models/task */ "./src/tasks/models/task.ts");
const recorded_1 = __webpack_require__(/*! ./models/recorded */ "./src/M1/models/recorded.ts");
const eligibility_1 = __webpack_require__(/*! ./models/eligibility */ "./src/M1/models/eligibility.ts");
const accuracy_calculation_service_1 = __webpack_require__(/*! ./services/accuracy.calculation.service */ "./src/M1/services/accuracy.calculation.service.ts");
const task_assignment_service_1 = __webpack_require__(/*! ./services/task.assignment.service */ "./src/M1/services/task.assignment.service.ts");
const update_eligibility_service_1 = __webpack_require__(/*! ./services/update.eligibility.service */ "./src/M1/services/update.eligibility.service.ts");
const get_recorded_service_1 = __webpack_require__(/*! ./services/get.recorded.service */ "./src/M1/services/get.recorded.service.ts");
const create_eligibility_service_1 = __webpack_require__(/*! ./services/create.eligibility.service */ "./src/M1/services/create.eligibility.service.ts");
const create_recorded_service_1 = __webpack_require__(/*! ./services/create.recorded.service */ "./src/M1/services/create.recorded.service.ts");
const get_eligibility_service_1 = __webpack_require__(/*! ./services/get.eligibility.service */ "./src/M1/services/get.eligibility.service.ts");
let M1Module = class M1Module {
};
exports.M1Module = M1Module;
exports.M1Module = M1Module = __decorate([
    (0, common_1.Module)({
        imports: [
            (0, common_1.forwardRef)(() => tasks_module_1.TasksModule),
            mongoose_1.MongooseModule.forFeature([
                { name: task_1.Task.name, schema: task_1.TaskSchema },
                { name: recorded_1.RecordedAnswer.name, schema: recorded_1.RecordedAnswerSchema },
                { name: eligibility_1.Eligibility.name, schema: eligibility_1.EligibilitySchema },
            ]),
        ],
        providers: [
            create_recorded_service_1.CreateRecordedService,
            create_eligibility_service_1.CreateEligibilityService,
            get_eligibility_service_1.GetElibilityService,
            get_recorded_service_1.GetRecordedAnswerService,
            task_assignment_service_1.TaskAssignmentService,
            accuracy_calculation_service_1.AccuracyCalculationService,
            update_eligibility_service_1.EligibilityUpdateService,
            m1_resolver_1.M1Resolver,
        ],
        exports: [
            create_recorded_service_1.CreateRecordedService,
            create_eligibility_service_1.CreateEligibilityService,
            get_eligibility_service_1.GetElibilityService,
            get_recorded_service_1.GetRecordedAnswerService,
            task_assignment_service_1.TaskAssignmentService,
            accuracy_calculation_service_1.AccuracyCalculationService,
            update_eligibility_service_1.EligibilityUpdateService,
        ],
    })
], M1Module);


/***/ }),

/***/ "./src/M1/m1.resolver.ts":
/*!*******************************!*\
  !*** ./src/M1/m1.resolver.ts ***!
  \*******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.M1Resolver = void 0;
const get_task_service_1 = __webpack_require__(/*! ./../tasks/services/get.task.service */ "./src/tasks/services/get.task.service.ts");
const graphql_1 = __webpack_require__(/*! @nestjs/graphql */ "@nestjs/graphql");
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const jwt_guard_1 = __webpack_require__(/*! src/auth/guards/jwt.guard */ "./src/auth/guards/jwt.guard.ts");
const role_guard_1 = __webpack_require__(/*! src/auth/guards/role.guard */ "./src/auth/guards/role.guard.ts");
const role_decorator_1 = __webpack_require__(/*! src/auth/decorators/role.decorator */ "./src/auth/decorators/role.decorator.ts");
const user_enum_1 = __webpack_require__(/*! src/lib/user.enum */ "./src/lib/user.enum.ts");
const accuracy_calculation_service_1 = __webpack_require__(/*! ./services/accuracy.calculation.service */ "./src/M1/services/accuracy.calculation.service.ts");
const task_assignment_service_1 = __webpack_require__(/*! ./services/task.assignment.service */ "./src/M1/services/task.assignment.service.ts");
const update_eligibility_service_1 = __webpack_require__(/*! ./services/update.eligibility.service */ "./src/M1/services/update.eligibility.service.ts");
const create_recorded_service_1 = __webpack_require__(/*! ./services/create.recorded.service */ "./src/M1/services/create.recorded.service.ts");
let M1Resolver = class M1Resolver {
    constructor(taskAssignmentService, accuracyCalculationService, eligibilityUpdateService, getTaskService, createRecordedService) {
        this.taskAssignmentService = taskAssignmentService;
        this.accuracyCalculationService = accuracyCalculationService;
        this.eligibilityUpdateService = eligibilityUpdateService;
        this.getTaskService = getTaskService;
        this.createRecordedService = createRecordedService;
    }
    async assignTask(taskId, workerId) {
        await this.taskAssignmentService.assignTaskToWorker(taskId, workerId);
        return true;
    }
    async submitAnswer(taskId, answer, context) {
        const workerId = context.req.user.id;
        await this.createRecordedService.recordAnswer(taskId, workerId, answer);
        return true;
    }
    async getEligibleWorkers(taskId, workersId) {
        const task = await this.getTaskService.getTaskById(taskId);
        if (!task)
            throw new Error('Task not found');
        const m = task.answers.length;
        const accuracies = await this.accuracyCalculationService.calculateAccuracy(taskId, workersId, m);
        await this.eligibilityUpdateService.updateEligibility(taskId, accuracies);
        const eligibleWorkers = Object.entries(accuracies)
            .filter(([, accuracy]) => accuracy >= 0.7)
            .map(([workerId]) => workerId);
        return eligibleWorkers;
    }
};
exports.M1Resolver = M1Resolver;
__decorate([
    (0, graphql_1.Mutation)(() => Boolean),
    (0, role_decorator_1.Roles)(user_enum_1.Role.ADMIN),
    __param(0, (0, graphql_1.Args)('taskId')),
    __param(1, (0, graphql_1.Args)('workerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", typeof (_f = typeof Promise !== "undefined" && Promise) === "function" ? _f : Object)
], M1Resolver.prototype, "assignTask", null);
__decorate([
    (0, graphql_1.Mutation)(() => Boolean),
    (0, role_decorator_1.Roles)(user_enum_1.Role.WORKER),
    __param(0, (0, graphql_1.Args)('taskId')),
    __param(1, (0, graphql_1.Args)('answer')),
    __param(2, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], M1Resolver.prototype, "submitAnswer", null);
__decorate([
    (0, graphql_1.Query)(() => [String]),
    (0, role_decorator_1.Roles)(user_enum_1.Role.ADMIN),
    __param(0, (0, graphql_1.Args)('taskId')),
    __param(1, (0, graphql_1.Args)('workerIds', { type: () => [String] })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", typeof (_h = typeof Promise !== "undefined" && Promise) === "function" ? _h : Object)
], M1Resolver.prototype, "getEligibleWorkers", null);
exports.M1Resolver = M1Resolver = __decorate([
    (0, graphql_1.Resolver)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RolesGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof task_assignment_service_1.TaskAssignmentService !== "undefined" && task_assignment_service_1.TaskAssignmentService) === "function" ? _a : Object, typeof (_b = typeof accuracy_calculation_service_1.AccuracyCalculationService !== "undefined" && accuracy_calculation_service_1.AccuracyCalculationService) === "function" ? _b : Object, typeof (_c = typeof update_eligibility_service_1.EligibilityUpdateService !== "undefined" && update_eligibility_service_1.EligibilityUpdateService) === "function" ? _c : Object, typeof (_d = typeof get_task_service_1.GetTaskService !== "undefined" && get_task_service_1.GetTaskService) === "function" ? _d : Object, typeof (_e = typeof create_recorded_service_1.CreateRecordedService !== "undefined" && create_recorded_service_1.CreateRecordedService) === "function" ? _e : Object])
], M1Resolver);


/***/ }),

/***/ "./src/M1/models/eligibility.ts":
/*!**************************************!*\
  !*** ./src/M1/models/eligibility.ts ***!
  \**************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EligibilitySchema = exports.Eligibility = void 0;
const graphql_1 = __webpack_require__(/*! @nestjs/graphql */ "@nestjs/graphql");
const mongoose_1 = __webpack_require__(/*! @nestjs/mongoose */ "@nestjs/mongoose");
const mongoose_2 = __webpack_require__(/*! mongoose */ "mongoose");
const recorded_1 = __webpack_require__(/*! ./recorded */ "./src/M1/models/recorded.ts");
let Eligibility = class Eligibility {
};
exports.Eligibility = Eligibility;
__decorate([
    (0, graphql_1.Field)(() => [String]),
    (0, mongoose_1.Prop)({ type: [mongoose_2.Types.ObjectId], ref: 'WorkerTasks', default: [] }),
    __metadata("design:type", Array)
], Eligibility.prototype, "taskIds", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Users', required: true }),
    __metadata("design:type", String)
], Eligibility.prototype, "workerId", void 0);
__decorate([
    (0, graphql_1.Field)(() => [recorded_1.RecordedAnswer]),
    (0, mongoose_1.Prop)({ type: [mongoose_2.Types.ObjectId], ref: 'RecordedAnswer', default: [] }),
    __metadata("design:type", Array)
], Eligibility.prototype, "answers", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Number)
], Eligibility.prototype, "accuracy", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Eligibility.prototype, "eligible", void 0);
exports.Eligibility = Eligibility = __decorate([
    (0, mongoose_1.Schema)(),
    (0, graphql_1.ObjectType)()
], Eligibility);
exports.EligibilitySchema = mongoose_1.SchemaFactory.createForClass(Eligibility);


/***/ }),

/***/ "./src/M1/models/recorded.ts":
/*!***********************************!*\
  !*** ./src/M1/models/recorded.ts ***!
  \***********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RecordedAnswerSchema = exports.RecordedAnswer = void 0;
const mongoose_1 = __webpack_require__(/*! @nestjs/mongoose */ "@nestjs/mongoose");
const mongoose_2 = __webpack_require__(/*! mongoose */ "mongoose");
let RecordedAnswer = class RecordedAnswer extends mongoose_2.Document {
};
exports.RecordedAnswer = RecordedAnswer;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Task', required: true }),
    __metadata("design:type", String)
], RecordedAnswer.prototype, "taskId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Worker', required: true }),
    __metadata("design:type", String)
], RecordedAnswer.prototype, "workerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], RecordedAnswer.prototype, "answer", void 0);
exports.RecordedAnswer = RecordedAnswer = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], RecordedAnswer);
exports.RecordedAnswerSchema = mongoose_1.SchemaFactory.createForClass(RecordedAnswer);


/***/ }),

/***/ "./src/M1/services/accuracy.calculation.service.ts":
/*!*********************************************************!*\
  !*** ./src/M1/services/accuracy.calculation.service.ts ***!
  \*********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AccuracyCalculationService = void 0;
const get_task_service_1 = __webpack_require__(/*! ./../../tasks/services/get.task.service */ "./src/tasks/services/get.task.service.ts");
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const mongoose_1 = __webpack_require__(/*! @nestjs/mongoose */ "@nestjs/mongoose");
const mongoose_2 = __webpack_require__(/*! mongoose */ "mongoose");
const recorded_1 = __webpack_require__(/*! ../models/recorded */ "./src/M1/models/recorded.ts");
const task_1 = __webpack_require__(/*! src/tasks/models/task */ "./src/tasks/models/task.ts");
let AccuracyCalculationService = class AccuracyCalculationService {
    constructor(recordedAnswerModel, getTaskService) {
        this.recordedAnswerModel = recordedAnswerModel;
        this.getTaskService = getTaskService;
    }
    async calculateAccuracy(taskId, workers, M) {
        const task = await this.getTaskService.getTaskById(taskId);
        const N = task.answers.length;
        const answers = await this.recordedAnswerModel.find({ taskId });
        const numWorkers = workers.length;
        const QijMatrix = Array.from({ length: numWorkers }, () => Array(numWorkers).fill(0));
        for (let i = 0; i < numWorkers; i++) {
            for (let j = i + 1; j < numWorkers; j++) {
                let Tij = 0;
                for (let k = 0; k < N; k++) {
                    const answerI = answers.find((a) => a.workerId.toString() === workers[i] &&
                        a.taskId.toString() === taskId &&
                        a['questionIndex'] === k);
                    const answerJ = answers.find((a) => a.workerId.toString() === workers[j] &&
                        a.taskId.toString() === taskId &&
                        a['questionIndex'] === k);
                    if (answerI && answerJ && answerI.answer === answerJ.answer) {
                        Tij++;
                    }
                }
                const Qij = Tij / N;
                QijMatrix[i][j] = Qij;
                QijMatrix[j][i] = Qij;
            }
        }
        const accuracies = this.solveForAccuracies(QijMatrix, workers, M);
        return accuracies;
    }
    solveForAccuracies(QijMatrix, workers, M) {
        const numWorkers = workers.length;
        let A = Array(numWorkers).fill(0.5);
        const tolerance = 0.0001;
        let maxIterations = 1000;
        const epsilon = 1e-6;
        while (maxIterations > 0) {
            maxIterations--;
            const newA = new Array(numWorkers).fill(0);
            for (let i = 0; i < numWorkers; i++) {
                let sumEstimates = 0;
                let count = 0;
                for (let j = 0; j < numWorkers; j++) {
                    if (i === j)
                        continue;
                    const Qij = QijMatrix[i][j];
                    if (Math.abs(M * A[j] - 1) < epsilon)
                        continue;
                    const estimate = ((M - 1) * Qij + A[j] - 1) / (M * A[j] - 1);
                    sumEstimates += estimate;
                    count++;
                }
                newA[i] = count > 0 ? sumEstimates / count : A[i];
            }
            let maxDiff = 0;
            for (let i = 0; i < numWorkers; i++) {
                maxDiff = Math.max(maxDiff, Math.abs(newA[i] - A[i]));
            }
            A = newA;
            if (maxDiff < tolerance)
                break;
        }
        const accuracyMap = {};
        workers.forEach((workerId, index) => {
            accuracyMap[workerId] = A[index];
        });
        return accuracyMap;
    }
};
exports.AccuracyCalculationService = AccuracyCalculationService;
exports.AccuracyCalculationService = AccuracyCalculationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(recorded_1.RecordedAnswer.name)),
    __param(1, (0, mongoose_1.InjectModel)(task_1.Task.name)),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object, typeof (_b = typeof get_task_service_1.GetTaskService !== "undefined" && get_task_service_1.GetTaskService) === "function" ? _b : Object])
], AccuracyCalculationService);


/***/ }),

/***/ "./src/M1/services/create.eligibility.service.ts":
/*!*******************************************************!*\
  !*** ./src/M1/services/create.eligibility.service.ts ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateEligibilityService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const mongoose_1 = __webpack_require__(/*! @nestjs/mongoose */ "@nestjs/mongoose");
const eligibility_1 = __webpack_require__(/*! ../models/eligibility */ "./src/M1/models/eligibility.ts");
const mongoose_2 = __webpack_require__(/*! mongoose */ "mongoose");
let CreateEligibilityService = class CreateEligibilityService {
    constructor(eligibilityModel) {
        this.eligibilityModel = eligibilityModel;
    }
    async createEligibility(input) {
        return await this.eligibilityModel.create({
            taskIds: [input.taskId],
            workerId: input.workerId,
            answers: [],
            eligible: false,
        });
    }
};
exports.CreateEligibilityService = CreateEligibilityService;
exports.CreateEligibilityService = CreateEligibilityService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(eligibility_1.Eligibility.name)),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object])
], CreateEligibilityService);


/***/ }),

/***/ "./src/M1/services/create.recorded.service.ts":
/*!****************************************************!*\
  !*** ./src/M1/services/create.recorded.service.ts ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateRecordedService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const mongoose_1 = __webpack_require__(/*! @nestjs/mongoose */ "@nestjs/mongoose");
const recorded_1 = __webpack_require__(/*! ../models/recorded */ "./src/M1/models/recorded.ts");
const mongoose_2 = __webpack_require__(/*! mongoose */ "mongoose");
const get_eligibility_service_1 = __webpack_require__(/*! ./get.eligibility.service */ "./src/M1/services/get.eligibility.service.ts");
let CreateRecordedService = class CreateRecordedService {
    constructor(recordedAnswerModel, getElibilityService) {
        this.recordedAnswerModel = recordedAnswerModel;
        this.getElibilityService = getElibilityService;
    }
    async createRecordedAnswer(taskId, workerId, answer) {
        return this.recordedAnswerModel.create({ taskId, workerId, answer });
    }
    async recordAnswer(taskId, workerId, answer) {
        await this.getElibilityService.findOneAndUpdate({ taskIds: taskId, workerId }, { $push: { answers: { taskId, workerId, answer } } }, { upsert: true, new: true });
        await this.createRecordedAnswer(taskId, workerId, answer);
    }
};
exports.CreateRecordedService = CreateRecordedService;
exports.CreateRecordedService = CreateRecordedService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(recorded_1.RecordedAnswer.name)),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object, typeof (_b = typeof get_eligibility_service_1.GetElibilityService !== "undefined" && get_eligibility_service_1.GetElibilityService) === "function" ? _b : Object])
], CreateRecordedService);


/***/ }),

/***/ "./src/M1/services/get.eligibility.service.ts":
/*!****************************************************!*\
  !*** ./src/M1/services/get.eligibility.service.ts ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetElibilityService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const mongoose_1 = __webpack_require__(/*! @nestjs/mongoose */ "@nestjs/mongoose");
const mongoose_2 = __webpack_require__(/*! mongoose */ "mongoose");
const eligibility_1 = __webpack_require__(/*! ../models/eligibility */ "./src/M1/models/eligibility.ts");
const gqlerr_1 = __webpack_require__(/*! @app/gqlerr */ "./libs/gqlerr/src/index.ts");
let GetElibilityService = class GetElibilityService {
    constructor(eligibilityModel) {
        this.eligibilityModel = eligibilityModel;
    }
    async getEligibility() {
        try {
            const res = await this.eligibilityModel.find();
            return res;
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL('Error getting eligibility', gqlerr_1.GQLThrowType.NOT_FOUND);
        }
    }
    async getEligibilityById(eligibilityId) {
        try {
            const res = await this.eligibilityModel.findById(eligibilityId);
            return res;
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL('Error getting eligibility', gqlerr_1.GQLThrowType.NOT_FOUND);
        }
    }
    async findOne(query) {
        try {
            const res = await this.eligibilityModel.findOne(query);
            return res;
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL('Error finding eligibility', gqlerr_1.GQLThrowType.NOT_FOUND);
        }
    }
    async findOneAndUpdate(query, update, options) {
        try {
            await this.eligibilityModel.findOneAndUpdate(query, update, options);
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL('Error updating eligibility', gqlerr_1.GQLThrowType.NOT_FOUND);
        }
    }
    async getElibilityAndUpdate(eligibilityId, update) {
        try {
            const res = await this.eligibilityModel.findByIdAndUpdate(eligibilityId, update, { new: true });
            return res;
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL('Error updating eligibility', gqlerr_1.GQLThrowType.NOT_FOUND);
        }
    }
};
exports.GetElibilityService = GetElibilityService;
exports.GetElibilityService = GetElibilityService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(eligibility_1.Eligibility.name)),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object])
], GetElibilityService);


/***/ }),

/***/ "./src/M1/services/get.recorded.service.ts":
/*!*************************************************!*\
  !*** ./src/M1/services/get.recorded.service.ts ***!
  \*************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetRecordedAnswerService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const mongoose_1 = __webpack_require__(/*! @nestjs/mongoose */ "@nestjs/mongoose");
const recorded_1 = __webpack_require__(/*! ../models/recorded */ "./src/M1/models/recorded.ts");
const mongoose_2 = __webpack_require__(/*! mongoose */ "mongoose");
let GetRecordedAnswerService = class GetRecordedAnswerService {
    constructor(recordedAnswerModel) {
        this.recordedAnswerModel = recordedAnswerModel;
    }
    async getRecordedAnswer(taskId) {
        return this.recordedAnswerModel.find({ taskId });
    }
    async getRecordedAnswerByWorkerId(workerId) {
        return this.recordedAnswerModel.find({ workerId });
    }
};
exports.GetRecordedAnswerService = GetRecordedAnswerService;
exports.GetRecordedAnswerService = GetRecordedAnswerService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(recorded_1.RecordedAnswer.name)),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object])
], GetRecordedAnswerService);


/***/ }),

/***/ "./src/M1/services/task.assignment.service.ts":
/*!****************************************************!*\
  !*** ./src/M1/services/task.assignment.service.ts ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TaskAssignmentService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const gqlerr_1 = __webpack_require__(/*! @app/gqlerr */ "./libs/gqlerr/src/index.ts");
const get_task_service_1 = __webpack_require__(/*! src/tasks/services/get.task.service */ "./src/tasks/services/get.task.service.ts");
const get_eligibility_service_1 = __webpack_require__(/*! ./get.eligibility.service */ "./src/M1/services/get.eligibility.service.ts");
let TaskAssignmentService = class TaskAssignmentService {
    constructor(getTaskService, getElibilityService) {
        this.getTaskService = getTaskService;
        this.getElibilityService = getElibilityService;
    }
    async assignTaskToWorker(taskId, workerId) {
        const task = await this.getTaskService.getTaskById(taskId);
        if (!task)
            throw new gqlerr_1.ThrowGQL('Task not found', gqlerr_1.GQLThrowType.NOT_FOUND);
        const existingAssignment = await this.getElibilityService.findOne({
            workerId,
            taskIds: taskId,
        });
        if (!existingAssignment) {
            await this.getElibilityService.findOneAndUpdate({ workerId }, {
                $push: { taskIds: taskId },
                $setOnInsert: { answers: [], eligible: false },
            }, { upsert: true, new: true });
        }
    }
};
exports.TaskAssignmentService = TaskAssignmentService;
exports.TaskAssignmentService = TaskAssignmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof get_task_service_1.GetTaskService !== "undefined" && get_task_service_1.GetTaskService) === "function" ? _a : Object, typeof (_b = typeof get_eligibility_service_1.GetElibilityService !== "undefined" && get_eligibility_service_1.GetElibilityService) === "function" ? _b : Object])
], TaskAssignmentService);


/***/ }),

/***/ "./src/M1/services/update.eligibility.service.ts":
/*!*******************************************************!*\
  !*** ./src/M1/services/update.eligibility.service.ts ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EligibilityUpdateService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const mongoose_1 = __webpack_require__(/*! @nestjs/mongoose */ "@nestjs/mongoose");
const mongoose_2 = __webpack_require__(/*! mongoose */ "mongoose");
const eligibility_1 = __webpack_require__(/*! ../models/eligibility */ "./src/M1/models/eligibility.ts");
let EligibilityUpdateService = class EligibilityUpdateService {
    constructor(eligibilityModel) {
        this.eligibilityModel = eligibilityModel;
    }
    async updateEligibility(taskId, accuracies, threshold = 0.7) {
        const updates = Object.entries(accuracies).map(([workerId, accuracy]) => ({
            updateOne: {
                filter: { taskId, workerId },
                update: { $set: { accuracy, eligible: accuracy >= threshold } },
            },
        }));
        if (updates.length > 0) {
            await this.eligibilityModel.bulkWrite(updates);
        }
    }
};
exports.EligibilityUpdateService = EligibilityUpdateService;
exports.EligibilityUpdateService = EligibilityUpdateService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(eligibility_1.Eligibility.name)),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object])
], EligibilityUpdateService);


/***/ }),

/***/ "./src/app.module.ts":
/*!***************************!*\
  !*** ./src/app.module.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const mongoose_1 = __webpack_require__(/*! @nestjs/mongoose */ "@nestjs/mongoose");
const graphql_1 = __webpack_require__(/*! @nestjs/graphql */ "@nestjs/graphql");
const apollo_1 = __webpack_require__(/*! @nestjs/apollo */ "@nestjs/apollo");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
const config_service_1 = __webpack_require__(/*! ./config/config.service */ "./src/config/config.service.ts");
const tasks_module_1 = __webpack_require__(/*! ./tasks/tasks.module */ "./src/tasks/tasks.module.ts");
const auth_module_1 = __webpack_require__(/*! ./auth/auth.module */ "./src/auth/auth.module.ts");
const users_module_1 = __webpack_require__(/*! ./users/users.module */ "./src/users/users.module.ts");
const m1_module_1 = __webpack_require__(/*! ./M1/m1.module */ "./src/M1/m1.module.ts");
const throttler_1 = __webpack_require__(/*! @nestjs/throttler */ "@nestjs/throttler");
const gqlerr_1 = __webpack_require__(/*! @app/gqlerr */ "./libs/gqlerr/src/index.ts");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, expandVariables: true }),
            throttler_1.ThrottlerModule.forRoot({ throttlers: [{ ttl: 60, limit: 10 }] }),
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (config) => ({
                    uri: config.get('MONGO_CONNECTION') ||
                        config_service_1.configService.getValue('MONGO_CONNECTION'),
                    dbName: config_service_1.configService.getValue('MONGO_DB_NAME'),
                    connectTimeoutMS: 10000,
                }),
            }),
            graphql_1.GraphQLModule.forRoot({
                driver: apollo_1.ApolloDriver,
                path: '/graphql',
                autoSchemaFile: true,
                sortSchema: true,
                introspection: true,
                playground: true,
                formatError: gqlerr_1.GQLErrFormatter,
            }),
            tasks_module_1.TasksModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            m1_module_1.M1Module,
        ],
    })
], AppModule);


/***/ }),

/***/ "./src/auth/auth.module.ts":
/*!*********************************!*\
  !*** ./src/auth/auth.module.ts ***!
  \*********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const auth_resolver_1 = __webpack_require__(/*! ./auth.resolver */ "./src/auth/auth.resolver.ts");
const users_module_1 = __webpack_require__(/*! src/users/users.module */ "./src/users/users.module.ts");
const auth_service_1 = __webpack_require__(/*! ./services/auth.service */ "./src/auth/services/auth.service.ts");
const mongoose_1 = __webpack_require__(/*! @nestjs/mongoose */ "@nestjs/mongoose");
const auth_1 = __webpack_require__(/*! ./models/auth */ "./src/auth/models/auth.ts");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            users_module_1.UsersModule,
            mongoose_1.MongooseModule.forFeature([{ name: auth_1.Auth.name, schema: auth_1.AuthSchema }]),
        ],
        providers: [auth_resolver_1.AuthResolver, auth_service_1.AuthService],
    })
], AuthModule);


/***/ }),

/***/ "./src/auth/auth.resolver.ts":
/*!***********************************!*\
  !*** ./src/auth/auth.resolver.ts ***!
  \***********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthResolver = void 0;
const graphql_1 = __webpack_require__(/*! @nestjs/graphql */ "@nestjs/graphql");
const auth_1 = __webpack_require__(/*! ./models/auth */ "./src/auth/models/auth.ts");
const auth_service_1 = __webpack_require__(/*! ./services/auth.service */ "./src/auth/services/auth.service.ts");
const auth_view_1 = __webpack_require__(/*! ./dto/views/auth.view */ "./src/auth/dto/views/auth.view.ts");
const create_auth_input_1 = __webpack_require__(/*! ./dto/inputs/create.auth.input */ "./src/auth/dto/inputs/create.auth.input.ts");
const user_view_1 = __webpack_require__(/*! src/users/dto/views/user.view */ "./src/users/dto/views/user.view.ts");
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const role_decorator_1 = __webpack_require__(/*! ./decorators/role.decorator */ "./src/auth/decorators/role.decorator.ts");
const role_guard_1 = __webpack_require__(/*! ./guards/role.guard */ "./src/auth/guards/role.guard.ts");
let AuthResolver = class AuthResolver {
    constructor(authService) {
        this.authService = authService;
    }
    async login(input) {
        const result = await this.authService.login(input);
        return result;
    }
    async register(input) {
        const result = await this.authService.register(input);
        return result;
    }
    async me(token) {
        return this.authService.getLoggedInUser(token);
    }
    async logout(context) {
        const token = context.req.headers.authorization?.split(' ')[1];
        if (!token)
            throw new Error('No token provided');
        await this.authService.logout(token);
        return true;
    }
};
exports.AuthResolver = AuthResolver;
__decorate([
    (0, graphql_1.Mutation)(() => auth_view_1.AuthView),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof create_auth_input_1.LoginInput !== "undefined" && create_auth_input_1.LoginInput) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], AuthResolver.prototype, "login", null);
__decorate([
    (0, graphql_1.Mutation)(() => auth_view_1.AuthView),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof create_auth_input_1.RegisterInput !== "undefined" && create_auth_input_1.RegisterInput) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], AuthResolver.prototype, "register", null);
__decorate([
    (0, graphql_1.Query)(() => user_view_1.UserView),
    (0, role_decorator_1.Roles)('admin', 'worker'),
    __param(0, (0, graphql_1.Args)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_f = typeof Promise !== "undefined" && Promise) === "function" ? _f : Object)
], AuthResolver.prototype, "me", null);
__decorate([
    (0, graphql_1.Mutation)(() => Boolean),
    __param(0, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], AuthResolver.prototype, "logout", null);
exports.AuthResolver = AuthResolver = __decorate([
    (0, graphql_1.Resolver)(() => auth_1.Auth),
    (0, common_1.UseGuards)(role_guard_1.RolesGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof auth_service_1.AuthService !== "undefined" && auth_service_1.AuthService) === "function" ? _a : Object])
], AuthResolver);


/***/ }),

/***/ "./src/auth/decorators/role.decorator.ts":
/*!***********************************************!*\
  !*** ./src/auth/decorators/role.decorator.ts ***!
  \***********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Roles = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const Roles = (...roles) => (0, common_1.SetMetadata)('roles', roles);
exports.Roles = Roles;


/***/ }),

/***/ "./src/auth/dto/inputs/create.auth.input.ts":
/*!**************************************************!*\
  !*** ./src/auth/dto/inputs/create.auth.input.ts ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ForgotPasswordInput = exports.LoginInput = exports.RegisterInput = void 0;
const graphql_1 = __webpack_require__(/*! @nestjs/graphql */ "@nestjs/graphql");
const class_validator_1 = __webpack_require__(/*! class-validator */ "class-validator");
const user_enum_1 = __webpack_require__(/*! src/lib/user.enum */ "./src/lib/user.enum.ts");
let RegisterInput = class RegisterInput {
};
exports.RegisterInput = RegisterInput;
__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RegisterInput.prototype, "email", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterInput.prototype, "firstName", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterInput.prototype, "lastName", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterInput.prototype, "userName", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], RegisterInput.prototype, "password", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], RegisterInput.prototype, "passwordConfirmation", void 0);
__decorate([
    (0, graphql_1.Field)(() => user_enum_1.Role),
    __metadata("design:type", typeof (_a = typeof user_enum_1.Role !== "undefined" && user_enum_1.Role) === "function" ? _a : Object)
], RegisterInput.prototype, "role", void 0);
exports.RegisterInput = RegisterInput = __decorate([
    (0, graphql_1.InputType)()
], RegisterInput);
let LoginInput = class LoginInput {
};
exports.LoginInput = LoginInput;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], LoginInput.prototype, "email", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], LoginInput.prototype, "password", void 0);
exports.LoginInput = LoginInput = __decorate([
    (0, graphql_1.InputType)()
], LoginInput);
let ForgotPasswordInput = class ForgotPasswordInput {
};
exports.ForgotPasswordInput = ForgotPasswordInput;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], ForgotPasswordInput.prototype, "email", void 0);
exports.ForgotPasswordInput = ForgotPasswordInput = __decorate([
    (0, graphql_1.InputType)()
], ForgotPasswordInput);


/***/ }),

/***/ "./src/auth/dto/views/auth.view.ts":
/*!*****************************************!*\
  !*** ./src/auth/dto/views/auth.view.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthView = void 0;
const graphql_1 = __webpack_require__(/*! @nestjs/graphql */ "@nestjs/graphql");
let AuthView = class AuthView {
};
exports.AuthView = AuthView;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AuthView.prototype, "accessToken", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AuthView.prototype, "refreshToken", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AuthView.prototype, "userId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AuthView.prototype, "role", void 0);
exports.AuthView = AuthView = __decorate([
    (0, graphql_1.ObjectType)()
], AuthView);


/***/ }),

/***/ "./src/auth/guards/jwt.guard.ts":
/*!**************************************!*\
  !*** ./src/auth/guards/jwt.guard.ts ***!
  \**************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JwtAuthGuard = void 0;
const dotenv = __webpack_require__(/*! dotenv */ "dotenv");
dotenv.config();
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const graphql_1 = __webpack_require__(/*! @nestjs/graphql */ "@nestjs/graphql");
const jwt = __webpack_require__(/*! jsonwebtoken */ "jsonwebtoken");
const gqlerr_1 = __webpack_require__(/*! @app/gqlerr */ "./libs/gqlerr/src/index.ts");
let JwtAuthGuard = class JwtAuthGuard {
    canActivate(context) {
        const ctx = graphql_1.GqlExecutionContext.create(context).getContext();
        const req = ctx.req;
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return false;
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return false;
        }
        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            req.user = decoded;
            return true;
        }
        catch (err) {
            throw new gqlerr_1.ThrowGQL('Unauthorized', gqlerr_1.GQLThrowType.NOT_AUTHORIZED);
        }
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)()
], JwtAuthGuard);


/***/ }),

/***/ "./src/auth/guards/role.guard.ts":
/*!***************************************!*\
  !*** ./src/auth/guards/role.guard.ts ***!
  \***************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RolesGuard = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const core_1 = __webpack_require__(/*! @nestjs/core */ "@nestjs/core");
const gqlerr_1 = __webpack_require__(/*! @app/gqlerr */ "./libs/gqlerr/src/index.ts");
const graphql_1 = __webpack_require__(/*! @nestjs/graphql */ "@nestjs/graphql");
let RolesGuard = class RolesGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride('roles', [
            context.getHandler(),
            context.getClass(),
        ]);
        const ctx = graphql_1.GqlExecutionContext.create(context).getContext();
        const req = ctx.req;
        const user = req.user;
        if (!requiredRoles) {
            return true;
        }
        if (!user || !user.role) {
            throw new gqlerr_1.ThrowGQL('Unauthorized', gqlerr_1.GQLThrowType.NOT_AUTHORIZED);
        }
        if (!requiredRoles.includes(user.role)) {
            throw new gqlerr_1.ThrowGQL('Wrong Role', gqlerr_1.GQLThrowType.FORBIDDEN);
        }
        return true;
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof core_1.Reflector !== "undefined" && core_1.Reflector) === "function" ? _a : Object])
], RolesGuard);


/***/ }),

/***/ "./src/auth/models/auth.ts":
/*!*********************************!*\
  !*** ./src/auth/models/auth.ts ***!
  \*********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthSchema = exports.Auth = void 0;
const graphql_1 = __webpack_require__(/*! @nestjs/graphql */ "@nestjs/graphql");
const mongoose_1 = __webpack_require__(/*! @nestjs/mongoose */ "@nestjs/mongoose");
let Auth = class Auth {
};
exports.Auth = Auth;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Auth.prototype, "authId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Auth.prototype, "accessToken", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Auth.prototype, "refreshToken", void 0);
exports.Auth = Auth = __decorate([
    (0, mongoose_1.Schema)(),
    (0, graphql_1.ObjectType)()
], Auth);
exports.AuthSchema = mongoose_1.SchemaFactory.createForClass(Auth);


/***/ }),

/***/ "./src/auth/models/parser.ts":
/*!***********************************!*\
  !*** ./src/auth/models/parser.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parseRegisterInput = parseRegisterInput;
const gqlerr_1 = __webpack_require__(/*! @app/gqlerr */ "./libs/gqlerr/src/index.ts");
const bcrypt = __webpack_require__(/*! bcrypt */ "bcrypt");
async function parseRegisterInput(input) {
    if (input.password !== input.passwordConfirmation) {
        throw new gqlerr_1.ThrowGQL('Passwords do not match', gqlerr_1.GQLThrowType.NOT_FOUND);
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(input.password, saltRounds);
    return {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        userName: input.userName,
        password: hashedPassword,
        passwordConfirmation: hashedPassword,
        role: input.role,
    };
}


/***/ }),

/***/ "./src/auth/services/auth.service.ts":
/*!*******************************************!*\
  !*** ./src/auth/services/auth.service.ts ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const mongoose_1 = __webpack_require__(/*! mongoose */ "mongoose");
const create_user_service_1 = __webpack_require__(/*! src/users/services/create.user.service */ "./src/users/services/create.user.service.ts");
const get_user_service_1 = __webpack_require__(/*! src/users/services/get.user.service */ "./src/users/services/get.user.service.ts");
const config_service_1 = __webpack_require__(/*! src/config/config.service */ "./src/config/config.service.ts");
const jwt = __webpack_require__(/*! jsonwebtoken */ "jsonwebtoken");
const bcrypt = __webpack_require__(/*! bcrypt */ "bcrypt");
const gqlerr_1 = __webpack_require__(/*! @app/gqlerr */ "./libs/gqlerr/src/index.ts");
const auth_1 = __webpack_require__(/*! ../models/auth */ "./src/auth/models/auth.ts");
const parser_1 = __webpack_require__(/*! ../models/parser */ "./src/auth/models/parser.ts");
const mongoose_2 = __webpack_require__(/*! @nestjs/mongoose */ "@nestjs/mongoose");
const parser_2 = __webpack_require__(/*! src/users/models/parser */ "./src/users/models/parser.ts");
let AuthService = class AuthService {
    constructor(authModel, createUserService, getUserService) {
        this.authModel = authModel;
        this.createUserService = createUserService;
        this.getUserService = getUserService;
    }
    async login(input) {
        try {
            const user = await this.getUserService.getUserByEmail(input.email);
            const secretKey = config_service_1.configService.getEnvValue('SECRET_KEY');
            const isPasswordValid = await bcrypt.compare(input.password, user.password);
            if (!isPasswordValid) {
                throw new gqlerr_1.ThrowGQL('Invalid credentials', gqlerr_1.GQLThrowType.NOT_AUTHORIZED);
            }
            const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, secretKey, { expiresIn: '1h' });
            const refreshToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, secretKey, { expiresIn: '7d' });
            await this.authModel.create({
                userId: user.id,
                accessToken: accessToken,
                refreshToken: refreshToken,
            });
            return {
                role: user.role,
                accessToken: accessToken,
                refreshToken: refreshToken,
                userId: user.id,
            };
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL(error.message, gqlerr_1.GQLThrowType.UNPROCESSABLE);
        }
    }
    async register(input) {
        try {
            const secretKey = config_service_1.configService.getEnvValue('SECRET_KEY');
            const parsedInput = (0, parser_1.parseRegisterInput)(input);
            const user = await this.createUserService.create(await parsedInput);
            const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, secretKey, { expiresIn: '1h' });
            const refreshToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, secretKey, { expiresIn: '7d' });
            await this.authModel.create({
                userId: user.id,
                accessToken: accessToken,
                refreshToken: refreshToken,
            });
            return {
                role: user.role,
                accessToken: accessToken,
                refreshToken: refreshToken,
                userId: user.id,
            };
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL(error.message, gqlerr_1.GQLThrowType.UNPROCESSABLE);
        }
    }
    async getLoggedInUser(token) {
        try {
            const secretKey = config_service_1.configService.getEnvValue('SECRET_KEY');
            const decoded = jwt.verify(token, secretKey);
            const user = await this.getUserService.getUserById(decoded.id);
            return (0, parser_2.parseToView)(user);
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL(error.message, gqlerr_1.GQLThrowType.UNPROCESSABLE);
        }
    }
    async logout(token) {
        await this.authModel.deleteOne({ refreshToken: token });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(auth_1.Auth.name)),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_1.Model !== "undefined" && mongoose_1.Model) === "function" ? _a : Object, typeof (_b = typeof create_user_service_1.CreateUserService !== "undefined" && create_user_service_1.CreateUserService) === "function" ? _b : Object, typeof (_c = typeof get_user_service_1.GetUserService !== "undefined" && get_user_service_1.GetUserService) === "function" ? _c : Object])
], AuthService);


/***/ }),

/***/ "./src/config/config.service.ts":
/*!**************************************!*\
  !*** ./src/config/config.service.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.configService = void 0;
(__webpack_require__(/*! dotenv */ "dotenv").config)();
class ConfigService {
    constructor(env) {
        this.env = env;
    }
    getValue(key, throwOnMissing = true) {
        const value = this.env[key];
        if (!value && throwOnMissing) {
            throw new Error(`config error - missing env.${key}`);
        }
        return value;
    }
    ensureValues(keys) {
        keys.forEach((k) => this.getValue(k, true));
        return this;
    }
    getPort() {
        return this.getValue('PORT', true);
    }
    isProduction() {
        const mode = this.getValue('MODE', false);
        return mode != 'DEV';
    }
    getEnvValue(key, throwOnMissing = true) {
        return this.getValue(key, throwOnMissing);
    }
}
const configService = new ConfigService(process.env).ensureValues([
    'PORT',
    'MONGO_CONNECTION',
    'MONGO_DB_NAME',
    'SECRET_KEY',
]);
exports.configService = configService;


/***/ }),

/***/ "./src/lib/user.enum.ts":
/*!******************************!*\
  !*** ./src/lib/user.enum.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Role = exports.Gender = void 0;
const graphql_1 = __webpack_require__(/*! @nestjs/graphql */ "@nestjs/graphql");
var Gender;
(function (Gender) {
    Gender["MEN"] = "pria";
    Gender["WOMEN"] = "wanita";
})(Gender || (exports.Gender = Gender = {}));
var Role;
(function (Role) {
    Role["ADMIN"] = "admin";
    Role["WORKER"] = "worker";
    Role["COMPANY_REPRESENTATIVE"] = "company_representative";
})(Role || (exports.Role = Role = {}));
(0, graphql_1.registerEnumType)(Gender, {
    name: 'GenderEnum',
    description: 'The Gender of the user',
});
(0, graphql_1.registerEnumType)(Role, {
    name: 'RoleEnum',
    description: 'The Role of the user',
});


/***/ }),

/***/ "./src/main.ts":
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/***/ ((module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __webpack_require__(/*! @nestjs/core */ "@nestjs/core");
const app_module_1 = __webpack_require__(/*! ./app.module */ "./src/app.module.ts");
const config_service_1 = __webpack_require__(/*! ./config/config.service */ "./src/config/config.service.ts");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
const gqlerr_1 = __webpack_require__(/*! @app/gqlerr */ "./libs/gqlerr/src/index.ts");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        cors: { origin: '*' },
    });
    const config = app.get(config_1.ConfigService);
    app.useGlobalFilters(new gqlerr_1.CustomGraphQLErrorFilter());
    await app.listen(config.get('PORT') || config_service_1.configService.getPort());
}
if (process.env.VERCEL_ENV) {
    module.exports = bootstrap();
}
else {
    bootstrap();
}


/***/ }),

/***/ "./src/tasks/dto/args/get.task.args.ts":
/*!*********************************************!*\
  !*** ./src/tasks/dto/args/get.task.args.ts ***!
  \*********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetTaskArgs = void 0;
const graphql_1 = __webpack_require__(/*! @nestjs/graphql */ "@nestjs/graphql");
let GetTaskArgs = class GetTaskArgs {
};
exports.GetTaskArgs = GetTaskArgs;
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], GetTaskArgs.prototype, "question", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", Number)
], GetTaskArgs.prototype, "skip", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", Number)
], GetTaskArgs.prototype, "take", void 0);
exports.GetTaskArgs = GetTaskArgs = __decorate([
    (0, graphql_1.ArgsType)()
], GetTaskArgs);


/***/ }),

/***/ "./src/tasks/dto/inputs/create.task.input.ts":
/*!***************************************************!*\
  !*** ./src/tasks/dto/inputs/create.task.input.ts ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateTaskInput = exports.AnswerInput = void 0;
const graphql_1 = __webpack_require__(/*! @nestjs/graphql */ "@nestjs/graphql");
let AnswerInput = class AnswerInput {
};
exports.AnswerInput = AnswerInput;
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], AnswerInput.prototype, "answer", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", Number)
], AnswerInput.prototype, "stats", void 0);
exports.AnswerInput = AnswerInput = __decorate([
    (0, graphql_1.InputType)()
], AnswerInput);
let CreateTaskInput = class CreateTaskInput {
};
exports.CreateTaskInput = CreateTaskInput;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], CreateTaskInput.prototype, "title", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], CreateTaskInput.prototype, "description", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], CreateTaskInput.prototype, "question", void 0);
__decorate([
    (0, graphql_1.Field)(() => [AnswerInput]),
    __metadata("design:type", Array)
], CreateTaskInput.prototype, "answers", void 0);
exports.CreateTaskInput = CreateTaskInput = __decorate([
    (0, graphql_1.InputType)()
], CreateTaskInput);


/***/ }),

/***/ "./src/tasks/dto/inputs/update.task.input.ts":
/*!***************************************************!*\
  !*** ./src/tasks/dto/inputs/update.task.input.ts ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateTaskInput = void 0;
const create_task_input_1 = __webpack_require__(/*! ./create.task.input */ "./src/tasks/dto/inputs/create.task.input.ts");
const graphql_1 = __webpack_require__(/*! @nestjs/graphql */ "@nestjs/graphql");
let UpdateTaskInput = class UpdateTaskInput extends (0, graphql_1.PartialType)(create_task_input_1.CreateTaskInput) {
};
exports.UpdateTaskInput = UpdateTaskInput;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], UpdateTaskInput.prototype, "id", void 0);
exports.UpdateTaskInput = UpdateTaskInput = __decorate([
    (0, graphql_1.InputType)()
], UpdateTaskInput);


/***/ }),

/***/ "./src/tasks/dto/views/task.view.input.ts":
/*!************************************************!*\
  !*** ./src/tasks/dto/views/task.view.input.ts ***!
  \************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TaskView = void 0;
const graphql_1 = __webpack_require__(/*! @nestjs/graphql */ "@nestjs/graphql");
const task_1 = __webpack_require__(/*! src/tasks/models/task */ "./src/tasks/models/task.ts");
let TaskView = class TaskView {
};
exports.TaskView = TaskView;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], TaskView.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], TaskView.prototype, "title", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], TaskView.prototype, "description", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], TaskView.prototype, "question", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], TaskView.prototype, "nAnswers", void 0);
__decorate([
    (0, graphql_1.Field)(() => [task_1.Answer]),
    __metadata("design:type", Array)
], TaskView.prototype, "answers", void 0);
exports.TaskView = TaskView = __decorate([
    (0, graphql_1.ObjectType)()
], TaskView);


/***/ }),

/***/ "./src/tasks/models/parser.ts":
/*!************************************!*\
  !*** ./src/tasks/models/parser.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parseRequest = exports.parseToView = void 0;
const parseToView = (input) => {
    return {
        id: input._id,
        title: input.title,
        description: input.description,
        question: input.question,
        nAnswers: input.answers.length,
        answers: input.answers,
    };
};
exports.parseToView = parseToView;
const parseRequest = (input) => {
    return {
        title: input.title,
        description: input.description,
        question: input.question,
        answers: input.answers,
        nAnswers: input.answers.length,
    };
};
exports.parseRequest = parseRequest;


/***/ }),

/***/ "./src/tasks/models/task.ts":
/*!**********************************!*\
  !*** ./src/tasks/models/task.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TaskSchema = exports.Task = exports.Answer = void 0;
const graphql_1 = __webpack_require__(/*! @nestjs/graphql */ "@nestjs/graphql");
const mongoose_1 = __webpack_require__(/*! @nestjs/mongoose */ "@nestjs/mongoose");
let Answer = class Answer {
};
exports.Answer = Answer;
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Answer.prototype, "answer", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Number)
], Answer.prototype, "stats", void 0);
exports.Answer = Answer = __decorate([
    (0, graphql_1.ObjectType)()
], Answer);
let Task = class Task {
};
exports.Task = Task;
__decorate([
    (0, graphql_1.Field)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Task.prototype, "_id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Task.prototype, "title", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Task.prototype, "description", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Task.prototype, "question", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Task.prototype, "nAnswers", void 0);
__decorate([
    (0, graphql_1.Field)(() => [Answer]),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Array)
], Task.prototype, "answers", void 0);
exports.Task = Task = __decorate([
    (0, mongoose_1.Schema)(),
    (0, graphql_1.ObjectType)()
], Task);
exports.TaskSchema = mongoose_1.SchemaFactory.createForClass(Task);


/***/ }),

/***/ "./src/tasks/services/count.task.service.ts":
/*!**************************************************!*\
  !*** ./src/tasks/services/count.task.service.ts ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CountTaskService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const mongoose_1 = __webpack_require__(/*! @nestjs/mongoose */ "@nestjs/mongoose");
const mongoose_2 = __webpack_require__(/*! mongoose */ "mongoose");
const get_recorded_service_1 = __webpack_require__(/*! src/M1/services/get.recorded.service */ "./src/M1/services/get.recorded.service.ts");
const task_1 = __webpack_require__(/*! ../models/task */ "./src/tasks/models/task.ts");
const schedule_1 = __webpack_require__(/*! @nestjs/schedule */ "@nestjs/schedule");
let CountTaskService = class CountTaskService {
    constructor(taskModel, getRecordedAnswerService) {
        this.taskModel = taskModel;
        this.getRecordedAnswerService = getRecordedAnswerService;
    }
    async countAnswerStat() {
        const tasks = await this.taskModel.find();
        if (!tasks.length)
            throw new Error('No tasks found');
        for (const task of tasks) {
            const recordedAnswers = await this.getRecordedAnswerService.getRecordedAnswer(task._id);
            const totalAnswers = recordedAnswers.length;
            task.answers.forEach((answer) => {
                const count = recordedAnswers.filter((recordedAnswer) => recordedAnswer.answer === answer.answer).length;
                answer.stats = count / totalAnswers;
            });
            await task.save();
        }
    }
};
exports.CountTaskService = CountTaskService;
__decorate([
    (0, schedule_1.Cron)('*/10 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], CountTaskService.prototype, "countAnswerStat", null);
exports.CountTaskService = CountTaskService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(task_1.Task.name)),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object, typeof (_b = typeof get_recorded_service_1.GetRecordedAnswerService !== "undefined" && get_recorded_service_1.GetRecordedAnswerService) === "function" ? _b : Object])
], CountTaskService);


/***/ }),

/***/ "./src/tasks/services/create.task.service.ts":
/*!***************************************************!*\
  !*** ./src/tasks/services/create.task.service.ts ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateTaskService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const mongoose_1 = __webpack_require__(/*! mongoose */ "mongoose");
const task_1 = __webpack_require__(/*! ../models/task */ "./src/tasks/models/task.ts");
const gqlerr_1 = __webpack_require__(/*! @app/gqlerr */ "./libs/gqlerr/src/index.ts");
const parser_1 = __webpack_require__(/*! ../models/parser */ "./src/tasks/models/parser.ts");
const mongoose_2 = __webpack_require__(/*! @nestjs/mongoose */ "@nestjs/mongoose");
const bson_1 = __webpack_require__(/*! bson */ "bson");
let CreateTaskService = class CreateTaskService {
    constructor(taskModel) {
        this.taskModel = taskModel;
    }
    async createTask(input) {
        try {
            const parsedResult = (0, parser_1.parseRequest)(input);
            const result = await this.taskModel.create({
                _id: new bson_1.ObjectId(),
                ...parsedResult,
            });
            return (0, parser_1.parseToView)(result);
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL(error, gqlerr_1.GQLThrowType.UNPROCESSABLE);
        }
    }
};
exports.CreateTaskService = CreateTaskService;
exports.CreateTaskService = CreateTaskService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(task_1.Task.name)),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_1.Model !== "undefined" && mongoose_1.Model) === "function" ? _a : Object])
], CreateTaskService);


/***/ }),

/***/ "./src/tasks/services/delete.task.service.ts":
/*!***************************************************!*\
  !*** ./src/tasks/services/delete.task.service.ts ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteTaskService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const mongoose_1 = __webpack_require__(/*! mongoose */ "mongoose");
const task_1 = __webpack_require__(/*! ../models/task */ "./src/tasks/models/task.ts");
const gqlerr_1 = __webpack_require__(/*! @app/gqlerr */ "./libs/gqlerr/src/index.ts");
const mongoose_2 = __webpack_require__(/*! @nestjs/mongoose */ "@nestjs/mongoose");
let DeleteTaskService = class DeleteTaskService {
    constructor(taskModel) {
        this.taskModel = taskModel;
    }
    async delete(id) {
        try {
            return this.taskModel.findByIdAndDelete(id);
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL(error, gqlerr_1.GQLThrowType.UNPROCESSABLE);
        }
    }
};
exports.DeleteTaskService = DeleteTaskService;
exports.DeleteTaskService = DeleteTaskService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(task_1.Task.name)),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_1.Model !== "undefined" && mongoose_1.Model) === "function" ? _a : Object])
], DeleteTaskService);


/***/ }),

/***/ "./src/tasks/services/get.task.service.ts":
/*!************************************************!*\
  !*** ./src/tasks/services/get.task.service.ts ***!
  \************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetTaskService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const mongoose_1 = __webpack_require__(/*! mongoose */ "mongoose");
const task_1 = __webpack_require__(/*! ../models/task */ "./src/tasks/models/task.ts");
const gqlerr_1 = __webpack_require__(/*! @app/gqlerr */ "./libs/gqlerr/src/index.ts");
const parser_1 = __webpack_require__(/*! ../models/parser */ "./src/tasks/models/parser.ts");
const mongoose_2 = __webpack_require__(/*! @nestjs/mongoose */ "@nestjs/mongoose");
let GetTaskService = class GetTaskService {
    constructor(taskModel) {
        this.taskModel = taskModel;
    }
    async getTaskById(id) {
        try {
            const res = await this.taskModel.findById(id);
            if (!res) {
                throw new gqlerr_1.ThrowGQL('Task not found', gqlerr_1.GQLThrowType.NOT_FOUND);
            }
            return (0, parser_1.parseToView)(res);
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL(error, gqlerr_1.GQLThrowType.UNPROCESSABLE);
        }
    }
    async getTasks(args) {
        try {
            const res = await this.taskModel.find().skip(args.skip).limit(args.take);
            return res.map((task) => (0, parser_1.parseToView)(task));
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL(error, gqlerr_1.GQLThrowType.UNPROCESSABLE);
        }
    }
};
exports.GetTaskService = GetTaskService;
exports.GetTaskService = GetTaskService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(task_1.Task.name)),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_1.Model !== "undefined" && mongoose_1.Model) === "function" ? _a : Object])
], GetTaskService);


/***/ }),

/***/ "./src/tasks/services/update.task.service.ts":
/*!***************************************************!*\
  !*** ./src/tasks/services/update.task.service.ts ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateTaskService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const gqlerr_1 = __webpack_require__(/*! @app/gqlerr */ "./libs/gqlerr/src/index.ts");
const task_1 = __webpack_require__(/*! ../models/task */ "./src/tasks/models/task.ts");
const mongoose_1 = __webpack_require__(/*! mongoose */ "mongoose");
const parser_1 = __webpack_require__(/*! ../models/parser */ "./src/tasks/models/parser.ts");
const mongoose_2 = __webpack_require__(/*! @nestjs/mongoose */ "@nestjs/mongoose");
let UpdateTaskService = class UpdateTaskService {
    constructor(taskModel) {
        this.taskModel = taskModel;
    }
    async updateTask(input) {
        try {
            const id = input.id;
            delete input.id;
            const res = await this.taskModel.findByIdAndUpdate(id, input, {
                new: true,
            });
            if (!res) {
                throw new gqlerr_1.ThrowGQL('Task not found', gqlerr_1.GQLThrowType.NOT_FOUND);
            }
            return (0, parser_1.parseToView)(res);
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL(error, gqlerr_1.GQLThrowType.UNPROCESSABLE);
        }
    }
};
exports.UpdateTaskService = UpdateTaskService;
exports.UpdateTaskService = UpdateTaskService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(task_1.Task.name)),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_1.Model !== "undefined" && mongoose_1.Model) === "function" ? _a : Object])
], UpdateTaskService);


/***/ }),

/***/ "./src/tasks/tasks.module.ts":
/*!***********************************!*\
  !*** ./src/tasks/tasks.module.ts ***!
  \***********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TasksModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const tasks_resolver_1 = __webpack_require__(/*! ./tasks.resolver */ "./src/tasks/tasks.resolver.ts");
const task_1 = __webpack_require__(/*! ./models/task */ "./src/tasks/models/task.ts");
const mongoose_1 = __webpack_require__(/*! @nestjs/mongoose */ "@nestjs/mongoose");
const create_task_service_1 = __webpack_require__(/*! ./services/create.task.service */ "./src/tasks/services/create.task.service.ts");
const get_task_service_1 = __webpack_require__(/*! ./services/get.task.service */ "./src/tasks/services/get.task.service.ts");
const update_task_service_1 = __webpack_require__(/*! ./services/update.task.service */ "./src/tasks/services/update.task.service.ts");
const delete_task_service_1 = __webpack_require__(/*! ./services/delete.task.service */ "./src/tasks/services/delete.task.service.ts");
const users_module_1 = __webpack_require__(/*! src/users/users.module */ "./src/users/users.module.ts");
const auth_module_1 = __webpack_require__(/*! src/auth/auth.module */ "./src/auth/auth.module.ts");
const count_task_service_1 = __webpack_require__(/*! ./services/count.task.service */ "./src/tasks/services/count.task.service.ts");
const m1_module_1 = __webpack_require__(/*! src/M1/m1.module */ "./src/M1/m1.module.ts");
let TasksModule = class TasksModule {
};
exports.TasksModule = TasksModule;
exports.TasksModule = TasksModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: task_1.Task.name, schema: task_1.TaskSchema }]),
            (0, common_1.forwardRef)(() => m1_module_1.M1Module),
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
        ],
        providers: [
            tasks_resolver_1.TasksResolver,
            create_task_service_1.CreateTaskService,
            get_task_service_1.GetTaskService,
            update_task_service_1.UpdateTaskService,
            delete_task_service_1.DeleteTaskService,
            count_task_service_1.CountTaskService,
        ],
        exports: [
            create_task_service_1.CreateTaskService,
            get_task_service_1.GetTaskService,
            update_task_service_1.UpdateTaskService,
            delete_task_service_1.DeleteTaskService,
            count_task_service_1.CountTaskService,
        ],
    })
], TasksModule);


/***/ }),

/***/ "./src/tasks/tasks.resolver.ts":
/*!*************************************!*\
  !*** ./src/tasks/tasks.resolver.ts ***!
  \*************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TasksResolver = void 0;
const graphql_1 = __webpack_require__(/*! @nestjs/graphql */ "@nestjs/graphql");
const create_task_service_1 = __webpack_require__(/*! ./services/create.task.service */ "./src/tasks/services/create.task.service.ts");
const task_1 = __webpack_require__(/*! ./models/task */ "./src/tasks/models/task.ts");
const get_task_service_1 = __webpack_require__(/*! ./services/get.task.service */ "./src/tasks/services/get.task.service.ts");
const delete_task_service_1 = __webpack_require__(/*! ./services/delete.task.service */ "./src/tasks/services/delete.task.service.ts");
const task_view_input_1 = __webpack_require__(/*! ./dto/views/task.view.input */ "./src/tasks/dto/views/task.view.input.ts");
const create_task_input_1 = __webpack_require__(/*! ./dto/inputs/create.task.input */ "./src/tasks/dto/inputs/create.task.input.ts");
const get_task_args_1 = __webpack_require__(/*! ./dto/args/get.task.args */ "./src/tasks/dto/args/get.task.args.ts");
const update_task_service_1 = __webpack_require__(/*! ./services/update.task.service */ "./src/tasks/services/update.task.service.ts");
const update_task_input_1 = __webpack_require__(/*! ./dto/inputs/update.task.input */ "./src/tasks/dto/inputs/update.task.input.ts");
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const role_guard_1 = __webpack_require__(/*! src/auth/guards/role.guard */ "./src/auth/guards/role.guard.ts");
const role_decorator_1 = __webpack_require__(/*! src/auth/decorators/role.decorator */ "./src/auth/decorators/role.decorator.ts");
const count_task_service_1 = __webpack_require__(/*! ./services/count.task.service */ "./src/tasks/services/count.task.service.ts");
const jwt_guard_1 = __webpack_require__(/*! src/auth/guards/jwt.guard */ "./src/auth/guards/jwt.guard.ts");
const user_enum_1 = __webpack_require__(/*! src/lib/user.enum */ "./src/lib/user.enum.ts");
let TasksResolver = class TasksResolver {
    constructor(createTaskService, getTaskService, deleteTaskService, updateTaskService, countTaskService) {
        this.createTaskService = createTaskService;
        this.getTaskService = getTaskService;
        this.deleteTaskService = deleteTaskService;
        this.updateTaskService = updateTaskService;
        this.countTaskService = countTaskService;
    }
    async createTask(input) {
        return this.createTaskService.createTask(input);
    }
    async updateTask(input) {
        return this.updateTaskService.updateTask(input);
    }
    async getTaskById(id) {
        return this.getTaskService.getTaskById(id);
    }
    async getTasks(args) {
        return this.getTaskService.getTasks(args);
    }
    async deleteTask(id) {
        return this.deleteTaskService.delete(id);
    }
};
exports.TasksResolver = TasksResolver;
__decorate([
    (0, graphql_1.Mutation)(() => task_view_input_1.TaskView),
    (0, role_decorator_1.Roles)(user_enum_1.Role.ADMIN),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof create_task_input_1.CreateTaskInput !== "undefined" && create_task_input_1.CreateTaskInput) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], TasksResolver.prototype, "createTask", null);
__decorate([
    (0, graphql_1.Mutation)(() => task_view_input_1.TaskView),
    (0, role_decorator_1.Roles)(user_enum_1.Role.ADMIN),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof update_task_input_1.UpdateTaskInput !== "undefined" && update_task_input_1.UpdateTaskInput) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], TasksResolver.prototype, "updateTask", null);
__decorate([
    (0, graphql_1.Query)(() => task_view_input_1.TaskView),
    (0, role_decorator_1.Roles)(user_enum_1.Role.ADMIN, user_enum_1.Role.WORKER),
    __param(0, (0, graphql_1.Args)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_k = typeof Promise !== "undefined" && Promise) === "function" ? _k : Object)
], TasksResolver.prototype, "getTaskById", null);
__decorate([
    (0, graphql_1.Query)(() => [task_view_input_1.TaskView]),
    (0, role_decorator_1.Roles)(user_enum_1.Role.ADMIN, user_enum_1.Role.WORKER),
    __param(0, (0, graphql_1.Args)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_l = typeof get_task_args_1.GetTaskArgs !== "undefined" && get_task_args_1.GetTaskArgs) === "function" ? _l : Object]),
    __metadata("design:returntype", typeof (_m = typeof Promise !== "undefined" && Promise) === "function" ? _m : Object)
], TasksResolver.prototype, "getTasks", null);
__decorate([
    (0, graphql_1.Mutation)(() => task_view_input_1.TaskView),
    (0, role_decorator_1.Roles)(user_enum_1.Role.ADMIN),
    __param(0, (0, graphql_1.Args)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], TasksResolver.prototype, "deleteTask", null);
exports.TasksResolver = TasksResolver = __decorate([
    (0, graphql_1.Resolver)(() => task_1.Task),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RolesGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof create_task_service_1.CreateTaskService !== "undefined" && create_task_service_1.CreateTaskService) === "function" ? _a : Object, typeof (_b = typeof get_task_service_1.GetTaskService !== "undefined" && get_task_service_1.GetTaskService) === "function" ? _b : Object, typeof (_c = typeof delete_task_service_1.DeleteTaskService !== "undefined" && delete_task_service_1.DeleteTaskService) === "function" ? _c : Object, typeof (_d = typeof update_task_service_1.UpdateTaskService !== "undefined" && update_task_service_1.UpdateTaskService) === "function" ? _d : Object, typeof (_e = typeof count_task_service_1.CountTaskService !== "undefined" && count_task_service_1.CountTaskService) === "function" ? _e : Object])
], TasksResolver);


/***/ }),

/***/ "./src/users/dto/args/get.user.args.ts":
/*!*********************************************!*\
  !*** ./src/users/dto/args/get.user.args.ts ***!
  \*********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetUserArgs = void 0;
const graphql_1 = __webpack_require__(/*! @nestjs/graphql */ "@nestjs/graphql");
let GetUserArgs = class GetUserArgs {
};
exports.GetUserArgs = GetUserArgs;
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", Number)
], GetUserArgs.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", Number)
], GetUserArgs.prototype, "skip", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", Number)
], GetUserArgs.prototype, "take", void 0);
exports.GetUserArgs = GetUserArgs = __decorate([
    (0, graphql_1.ArgsType)()
], GetUserArgs);


/***/ }),

/***/ "./src/users/dto/inputs/create.user.input.ts":
/*!***************************************************!*\
  !*** ./src/users/dto/inputs/create.user.input.ts ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateUserInput = void 0;
const graphql_1 = __webpack_require__(/*! @nestjs/graphql */ "@nestjs/graphql");
const user_enum_1 = __webpack_require__(/*! src/lib/user.enum */ "./src/lib/user.enum.ts");
let CreateUserInput = class CreateUserInput {
};
exports.CreateUserInput = CreateUserInput;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], CreateUserInput.prototype, "email", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], CreateUserInput.prototype, "firstName", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], CreateUserInput.prototype, "lastName", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], CreateUserInput.prototype, "userName", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], CreateUserInput.prototype, "password", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], CreateUserInput.prototype, "passwordConfirmation", void 0);
__decorate([
    (0, graphql_1.Field)(() => user_enum_1.Role),
    __metadata("design:type", typeof (_a = typeof user_enum_1.Role !== "undefined" && user_enum_1.Role) === "function" ? _a : Object)
], CreateUserInput.prototype, "role", void 0);
exports.CreateUserInput = CreateUserInput = __decorate([
    (0, graphql_1.InputType)()
], CreateUserInput);


/***/ }),

/***/ "./src/users/dto/inputs/update.user.input.ts":
/*!***************************************************!*\
  !*** ./src/users/dto/inputs/update.user.input.ts ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateUserInput = void 0;
const create_user_input_1 = __webpack_require__(/*! ./create.user.input */ "./src/users/dto/inputs/create.user.input.ts");
const graphql_1 = __webpack_require__(/*! @nestjs/graphql */ "@nestjs/graphql");
let UpdateUserInput = class UpdateUserInput extends (0, graphql_1.PartialType)(create_user_input_1.CreateUserInput) {
};
exports.UpdateUserInput = UpdateUserInput;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], UpdateUserInput.prototype, "id", void 0);
exports.UpdateUserInput = UpdateUserInput = __decorate([
    (0, graphql_1.InputType)()
], UpdateUserInput);


/***/ }),

/***/ "./src/users/dto/views/user.view.ts":
/*!******************************************!*\
  !*** ./src/users/dto/views/user.view.ts ***!
  \******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserView = void 0;
const graphql_1 = __webpack_require__(/*! @nestjs/graphql */ "@nestjs/graphql");
let UserView = class UserView {
};
exports.UserView = UserView;
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], UserView.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], UserView.prototype, "firstName", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], UserView.prototype, "lastName", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], UserView.prototype, "userName", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], UserView.prototype, "email", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], UserView.prototype, "password", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", Number)
], UserView.prototype, "age", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], UserView.prototype, "phoneNumber", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], UserView.prototype, "gender", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], UserView.prototype, "role", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], UserView.prototype, "address1", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], UserView.prototype, "address2", void 0);
exports.UserView = UserView = __decorate([
    (0, graphql_1.ObjectType)()
], UserView);


/***/ }),

/***/ "./src/users/models/parser.ts":
/*!************************************!*\
  !*** ./src/users/models/parser.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parseToView = void 0;
const parseToView = (input) => {
    return {
        id: input.id,
        firstName: input.firstName,
        lastName: input.lastName,
        userName: input.userName,
        email: input.email,
        age: input.age,
        role: input.role,
        phoneNumber: input.phoneNumber,
        gender: input.gender,
        address1: input.address1,
        address2: input.address2,
        password: input.password,
    };
};
exports.parseToView = parseToView;


/***/ }),

/***/ "./src/users/models/user.ts":
/*!**********************************!*\
  !*** ./src/users/models/user.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UsersSchema = exports.Users = void 0;
const graphql_1 = __webpack_require__(/*! @nestjs/graphql */ "@nestjs/graphql");
const mongoose_1 = __webpack_require__(/*! @nestjs/mongoose */ "@nestjs/mongoose");
const user_enum_1 = __webpack_require__(/*! src/lib/user.enum */ "./src/lib/user.enum.ts");
let Users = class Users {
};
exports.Users = Users;
__decorate([
    (0, graphql_1.Field)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Users.prototype, "_id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Users.prototype, "firstName", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Users.prototype, "lastName", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Users.prototype, "userName", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Users.prototype, "email", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Users.prototype, "password", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Number)
], Users.prototype, "age", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Users.prototype, "phoneNumber", void 0);
__decorate([
    (0, graphql_1.Field)(() => user_enum_1.Gender),
    (0, mongoose_1.Prop)({ type: String, required: false }),
    __metadata("design:type", typeof (_a = typeof user_enum_1.Gender !== "undefined" && user_enum_1.Gender) === "function" ? _a : Object)
], Users.prototype, "gender", void 0);
__decorate([
    (0, graphql_1.Field)(() => user_enum_1.Role),
    (0, mongoose_1.Prop)({ type: String, required: false }),
    __metadata("design:type", typeof (_b = typeof user_enum_1.Role !== "undefined" && user_enum_1.Role) === "function" ? _b : Object)
], Users.prototype, "role", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Users.prototype, "address1", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Users.prototype, "address2", void 0);
exports.Users = Users = __decorate([
    (0, mongoose_1.Schema)(),
    (0, graphql_1.ObjectType)()
], Users);
exports.UsersSchema = mongoose_1.SchemaFactory.createForClass(Users);


/***/ }),

/***/ "./src/users/services/create.user.service.ts":
/*!***************************************************!*\
  !*** ./src/users/services/create.user.service.ts ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateUserService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const mongoose_1 = __webpack_require__(/*! @nestjs/mongoose */ "@nestjs/mongoose");
const mongoose_2 = __webpack_require__(/*! mongoose */ "mongoose");
const user_1 = __webpack_require__(/*! src/users/models/user */ "./src/users/models/user.ts");
const bson_1 = __webpack_require__(/*! bson */ "bson");
const parser_1 = __webpack_require__(/*! ../models/parser */ "./src/users/models/parser.ts");
const gqlerr_1 = __webpack_require__(/*! @app/gqlerr */ "./libs/gqlerr/src/index.ts");
let CreateUserService = class CreateUserService {
    constructor(userModel) {
        this.userModel = userModel;
    }
    async create(createUserInput) {
        try {
            const user = await new this.userModel({
                _id: new bson_1.ObjectId(),
                ...createUserInput,
            }).save();
            return (0, parser_1.parseToView)(user);
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL(error, gqlerr_1.GQLThrowType.UNPROCESSABLE);
        }
    }
};
exports.CreateUserService = CreateUserService;
exports.CreateUserService = CreateUserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_1.Users.name)),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object])
], CreateUserService);


/***/ }),

/***/ "./src/users/services/delete.user.service.ts":
/*!***************************************************!*\
  !*** ./src/users/services/delete.user.service.ts ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteUserService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const mongoose_1 = __webpack_require__(/*! @nestjs/mongoose */ "@nestjs/mongoose");
const mongoose_2 = __webpack_require__(/*! mongoose */ "mongoose");
const user_1 = __webpack_require__(/*! ../models/user */ "./src/users/models/user.ts");
const gqlerr_1 = __webpack_require__(/*! @app/gqlerr */ "./libs/gqlerr/src/index.ts");
const parser_1 = __webpack_require__(/*! ../models/parser */ "./src/users/models/parser.ts");
let DeleteUserService = class DeleteUserService {
    constructor(userModel) {
        this.userModel = userModel;
    }
    async delete(id) {
        try {
            const res = await this.userModel.findByIdAndDelete(id);
            return (0, parser_1.parseToView)(res);
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL(error, gqlerr_1.GQLThrowType.UNPROCESSABLE);
        }
    }
    async deleteAll() {
        try {
            return this.userModel.deleteMany({});
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL(error, gqlerr_1.GQLThrowType.UNPROCESSABLE);
        }
    }
};
exports.DeleteUserService = DeleteUserService;
exports.DeleteUserService = DeleteUserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_1.Users.name)),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object])
], DeleteUserService);


/***/ }),

/***/ "./src/users/services/get.user.service.ts":
/*!************************************************!*\
  !*** ./src/users/services/get.user.service.ts ***!
  \************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetUserService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const mongoose_1 = __webpack_require__(/*! @nestjs/mongoose */ "@nestjs/mongoose");
const mongoose_2 = __webpack_require__(/*! mongoose */ "mongoose");
const user_1 = __webpack_require__(/*! src/users/models/user */ "./src/users/models/user.ts");
const gqlerr_1 = __webpack_require__(/*! @app/gqlerr */ "./libs/gqlerr/src/index.ts");
const parser_1 = __webpack_require__(/*! ../models/parser */ "./src/users/models/parser.ts");
let GetUserService = class GetUserService {
    constructor(usersModel) {
        this.usersModel = usersModel;
    }
    async getUserByUsername(userName) {
        try {
            const res = await this.usersModel.findOne({ userName });
            return (0, parser_1.parseToView)(res);
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL(error, gqlerr_1.GQLThrowType.UNPROCESSABLE);
        }
    }
    async getUserByEmail(email) {
        try {
            const res = await this.usersModel.findOne({ email });
            return (0, parser_1.parseToView)(res);
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL(error, gqlerr_1.GQLThrowType.UNPROCESSABLE);
        }
    }
    async getUserById(id) {
        try {
            const res = await this.usersModel.findById(id);
            return (0, parser_1.parseToView)(res);
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL(error, gqlerr_1.GQLThrowType.UNPROCESSABLE);
        }
    }
    async getAllUsers(args) {
        try {
            const res = await this.usersModel.find().limit(args.take).skip(args.skip);
            return res.map(parser_1.parseToView);
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL(error, gqlerr_1.GQLThrowType.UNPROCESSABLE);
        }
    }
};
exports.GetUserService = GetUserService;
exports.GetUserService = GetUserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_1.Users.name)),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object])
], GetUserService);


/***/ }),

/***/ "./src/users/services/update.user.service.ts":
/*!***************************************************!*\
  !*** ./src/users/services/update.user.service.ts ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateUserService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const mongoose_1 = __webpack_require__(/*! @nestjs/mongoose */ "@nestjs/mongoose");
const mongoose_2 = __webpack_require__(/*! mongoose */ "mongoose");
const user_1 = __webpack_require__(/*! ../models/user */ "./src/users/models/user.ts");
const gqlerr_1 = __webpack_require__(/*! @app/gqlerr */ "./libs/gqlerr/src/index.ts");
const parser_1 = __webpack_require__(/*! ../models/parser */ "./src/users/models/parser.ts");
let UpdateUserService = class UpdateUserService {
    constructor(userModel) {
        this.userModel = userModel;
    }
    async updateUser(input) {
        try {
            const id = input.id;
            delete input.id;
            const user = await this.userModel.findByIdAndUpdate(id, { $set: input }, { new: true });
            if (!user) {
                throw new gqlerr_1.ThrowGQL('User not found', gqlerr_1.GQLThrowType.NOT_FOUND);
            }
            return (0, parser_1.parseToView)(user);
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL(error, gqlerr_1.GQLThrowType.UNPROCESSABLE);
        }
    }
};
exports.UpdateUserService = UpdateUserService;
exports.UpdateUserService = UpdateUserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_1.Users.name)),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object])
], UpdateUserService);


/***/ }),

/***/ "./src/users/users.module.ts":
/*!***********************************!*\
  !*** ./src/users/users.module.ts ***!
  \***********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UsersModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const mongoose_1 = __webpack_require__(/*! @nestjs/mongoose */ "@nestjs/mongoose");
const user_1 = __webpack_require__(/*! ./models/user */ "./src/users/models/user.ts");
const users_resolver_1 = __webpack_require__(/*! ./users.resolver */ "./src/users/users.resolver.ts");
const create_user_service_1 = __webpack_require__(/*! ./services/create.user.service */ "./src/users/services/create.user.service.ts");
const get_user_service_1 = __webpack_require__(/*! ./services/get.user.service */ "./src/users/services/get.user.service.ts");
const update_user_service_1 = __webpack_require__(/*! ./services/update.user.service */ "./src/users/services/update.user.service.ts");
const delete_user_service_1 = __webpack_require__(/*! ./services/delete.user.service */ "./src/users/services/delete.user.service.ts");
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: user_1.Users.name, schema: user_1.UsersSchema }]),
        ],
        providers: [
            users_resolver_1.UsersResolver,
            create_user_service_1.CreateUserService,
            get_user_service_1.GetUserService,
            update_user_service_1.UpdateUserService,
            delete_user_service_1.DeleteUserService,
        ],
        exports: [
            create_user_service_1.CreateUserService,
            get_user_service_1.GetUserService,
            update_user_service_1.UpdateUserService,
            delete_user_service_1.DeleteUserService,
        ],
    })
], UsersModule);


/***/ }),

/***/ "./src/users/users.resolver.ts":
/*!*************************************!*\
  !*** ./src/users/users.resolver.ts ***!
  \*************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UsersResolver = void 0;
const graphql_1 = __webpack_require__(/*! @nestjs/graphql */ "@nestjs/graphql");
const user_1 = __webpack_require__(/*! ./models/user */ "./src/users/models/user.ts");
const delete_user_service_1 = __webpack_require__(/*! ./services/delete.user.service */ "./src/users/services/delete.user.service.ts");
const create_user_service_1 = __webpack_require__(/*! ./services/create.user.service */ "./src/users/services/create.user.service.ts");
const update_user_service_1 = __webpack_require__(/*! ./services/update.user.service */ "./src/users/services/update.user.service.ts");
const user_view_1 = __webpack_require__(/*! ./dto/views/user.view */ "./src/users/dto/views/user.view.ts");
const create_user_input_1 = __webpack_require__(/*! ./dto/inputs/create.user.input */ "./src/users/dto/inputs/create.user.input.ts");
const update_user_input_1 = __webpack_require__(/*! ./dto/inputs/update.user.input */ "./src/users/dto/inputs/update.user.input.ts");
const graphql_2 = __webpack_require__(/*! @nestjs/graphql */ "@nestjs/graphql");
const get_user_args_1 = __webpack_require__(/*! ./dto/args/get.user.args */ "./src/users/dto/args/get.user.args.ts");
const get_user_service_1 = __webpack_require__(/*! ./services/get.user.service */ "./src/users/services/get.user.service.ts");
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const role_decorator_1 = __webpack_require__(/*! src/auth/decorators/role.decorator */ "./src/auth/decorators/role.decorator.ts");
const role_guard_1 = __webpack_require__(/*! src/auth/guards/role.guard */ "./src/auth/guards/role.guard.ts");
const jwt_guard_1 = __webpack_require__(/*! src/auth/guards/jwt.guard */ "./src/auth/guards/jwt.guard.ts");
let UsersResolver = class UsersResolver {
    constructor(createUserService, updateUserService, deleteUserService, getUserService) {
        this.createUserService = createUserService;
        this.updateUserService = updateUserService;
        this.deleteUserService = deleteUserService;
        this.getUserService = getUserService;
    }
    async createUser(input) {
        return this.createUserService.create(input);
    }
    async updateUser(input) {
        return this.updateUserService.updateUser(input);
    }
    async deleteUser(id) {
        return this.deleteUserService.delete(id);
    }
    async getAllUsers(args) {
        return this.getUserService.getAllUsers(args);
    }
    async getUserByUsername(userName) {
        return this.getUserService.getUserByUsername(userName);
    }
    async getUserByEmail(email) {
        return this.getUserService.getUserByEmail(email);
    }
    async getUserById(id) {
        return this.getUserService.getUserById(id);
    }
};
exports.UsersResolver = UsersResolver;
__decorate([
    (0, graphql_1.Mutation)(() => user_view_1.UserView),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof create_user_input_1.CreateUserInput !== "undefined" && create_user_input_1.CreateUserInput) === "function" ? _e : Object]),
    __metadata("design:returntype", typeof (_f = typeof Promise !== "undefined" && Promise) === "function" ? _f : Object)
], UsersResolver.prototype, "createUser", null);
__decorate([
    (0, graphql_1.Mutation)(() => user_view_1.UserView),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_g = typeof update_user_input_1.UpdateUserInput !== "undefined" && update_user_input_1.UpdateUserInput) === "function" ? _g : Object]),
    __metadata("design:returntype", typeof (_h = typeof Promise !== "undefined" && Promise) === "function" ? _h : Object)
], UsersResolver.prototype, "updateUser", null);
__decorate([
    (0, graphql_1.Mutation)(() => user_view_1.UserView),
    (0, role_decorator_1.Roles)('admin'),
    __param(0, (0, graphql_1.Args)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], UsersResolver.prototype, "deleteUser", null);
__decorate([
    (0, graphql_2.Query)(() => [user_view_1.UserView]),
    (0, role_decorator_1.Roles)('admin'),
    __param(0, (0, graphql_1.Args)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof get_user_args_1.GetUserArgs !== "undefined" && get_user_args_1.GetUserArgs) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], UsersResolver.prototype, "getAllUsers", null);
__decorate([
    (0, graphql_2.Query)(() => user_view_1.UserView),
    __param(0, (0, graphql_1.Args)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_m = typeof Promise !== "undefined" && Promise) === "function" ? _m : Object)
], UsersResolver.prototype, "getUserByUsername", null);
__decorate([
    (0, graphql_2.Query)(() => user_view_1.UserView),
    __param(0, (0, graphql_1.Args)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], UsersResolver.prototype, "getUserByEmail", null);
__decorate([
    (0, graphql_2.Query)(() => user_view_1.UserView),
    __param(0, (0, graphql_1.Args)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_p = typeof Promise !== "undefined" && Promise) === "function" ? _p : Object)
], UsersResolver.prototype, "getUserById", null);
exports.UsersResolver = UsersResolver = __decorate([
    (0, graphql_1.Resolver)(() => user_1.Users),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RolesGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof create_user_service_1.CreateUserService !== "undefined" && create_user_service_1.CreateUserService) === "function" ? _a : Object, typeof (_b = typeof update_user_service_1.UpdateUserService !== "undefined" && update_user_service_1.UpdateUserService) === "function" ? _b : Object, typeof (_c = typeof delete_user_service_1.DeleteUserService !== "undefined" && delete_user_service_1.DeleteUserService) === "function" ? _c : Object, typeof (_d = typeof get_user_service_1.GetUserService !== "undefined" && get_user_service_1.GetUserService) === "function" ? _d : Object])
], UsersResolver);


/***/ }),

/***/ "@nestjs/apollo":
/*!*********************************!*\
  !*** external "@nestjs/apollo" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@nestjs/apollo");

/***/ }),

/***/ "@nestjs/common":
/*!*********************************!*\
  !*** external "@nestjs/common" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),

/***/ "@nestjs/config":
/*!*********************************!*\
  !*** external "@nestjs/config" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),

/***/ "@nestjs/core":
/*!*******************************!*\
  !*** external "@nestjs/core" ***!
  \*******************************/
/***/ ((module) => {

module.exports = require("@nestjs/core");

/***/ }),

/***/ "@nestjs/graphql":
/*!**********************************!*\
  !*** external "@nestjs/graphql" ***!
  \**********************************/
/***/ ((module) => {

module.exports = require("@nestjs/graphql");

/***/ }),

/***/ "@nestjs/mongoose":
/*!***********************************!*\
  !*** external "@nestjs/mongoose" ***!
  \***********************************/
/***/ ((module) => {

module.exports = require("@nestjs/mongoose");

/***/ }),

/***/ "@nestjs/schedule":
/*!***********************************!*\
  !*** external "@nestjs/schedule" ***!
  \***********************************/
/***/ ((module) => {

module.exports = require("@nestjs/schedule");

/***/ }),

/***/ "@nestjs/throttler":
/*!************************************!*\
  !*** external "@nestjs/throttler" ***!
  \************************************/
/***/ ((module) => {

module.exports = require("@nestjs/throttler");

/***/ }),

/***/ "bcrypt":
/*!*************************!*\
  !*** external "bcrypt" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("bcrypt");

/***/ }),

/***/ "bson":
/*!***********************!*\
  !*** external "bson" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("bson");

/***/ }),

/***/ "class-validator":
/*!**********************************!*\
  !*** external "class-validator" ***!
  \**********************************/
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),

/***/ "dotenv":
/*!*************************!*\
  !*** external "dotenv" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("dotenv");

/***/ }),

/***/ "jsonwebtoken":
/*!*******************************!*\
  !*** external "jsonwebtoken" ***!
  \*******************************/
/***/ ((module) => {

module.exports = require("jsonwebtoken");

/***/ }),

/***/ "mongoose":
/*!***************************!*\
  !*** external "mongoose" ***!
  \***************************/
/***/ ((module) => {

module.exports = require("mongoose");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/main.ts");
/******/ 	
/******/ })()
;