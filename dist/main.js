/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ ((module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __webpack_require__(1);
const app_module_1 = __webpack_require__(2);
const config_service_1 = __webpack_require__(8);
const config_1 = __webpack_require__(7);
const gqlerr_1 = __webpack_require__(15);
const cookieParser = __webpack_require__(74);
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        cors: { origin: '*', credentials: true },
    });
    const config = app.get(config_1.ConfigService);
    app.use(cookieParser());
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
/* 1 */
/***/ ((module) => {

module.exports = require("@nestjs/core");

/***/ }),
/* 2 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppModule = void 0;
const common_1 = __webpack_require__(3);
const mongoose_1 = __webpack_require__(4);
const graphql_1 = __webpack_require__(5);
const apollo_1 = __webpack_require__(6);
const config_1 = __webpack_require__(7);
const config_service_1 = __webpack_require__(8);
const tasks_module_1 = __webpack_require__(10);
const auth_module_1 = __webpack_require__(65);
const users_module_1 = __webpack_require__(31);
const mx_module_1 = __webpack_require__(54);
const throttler_1 = __webpack_require__(73);
const gqlerr_1 = __webpack_require__(15);
const schedule_1 = __webpack_require__(20);
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, expandVariables: true }),
            throttler_1.ThrottlerModule.forRoot({ throttlers: [{ ttl: 60, limit: 10 }] }),
            schedule_1.ScheduleModule.forRoot(),
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
                context: ({ req, res }) => ({ req, res }),
            }),
            tasks_module_1.TasksModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            mx_module_1.M1Module,
        ],
    })
], AppModule);


/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),
/* 4 */
/***/ ((module) => {

module.exports = require("@nestjs/mongoose");

/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("@nestjs/graphql");

/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("@nestjs/apollo");

/***/ }),
/* 7 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.configService = void 0;
(__webpack_require__(9).config)();
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
    'MX_THRESHOLD',
]);
exports.configService = configService;


/***/ }),
/* 9 */
/***/ ((module) => {

module.exports = require("dotenv");

/***/ }),
/* 10 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TasksModule = void 0;
const common_1 = __webpack_require__(3);
const tasks_resolver_1 = __webpack_require__(11);
const task_1 = __webpack_require__(14);
const mongoose_1 = __webpack_require__(4);
const create_task_service_1 = __webpack_require__(12);
const get_task_service_1 = __webpack_require__(19);
const update_task_service_1 = __webpack_require__(27);
const delete_task_service_1 = __webpack_require__(23);
const users_module_1 = __webpack_require__(31);
const auth_module_1 = __webpack_require__(65);
const mx_module_1 = __webpack_require__(54);
let TasksModule = class TasksModule {
};
exports.TasksModule = TasksModule;
exports.TasksModule = TasksModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: task_1.Task.name, schema: task_1.TaskSchema }]),
            (0, common_1.forwardRef)(() => mx_module_1.M1Module),
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
        ],
        providers: [
            tasks_resolver_1.TasksResolver,
            create_task_service_1.CreateTaskService,
            get_task_service_1.GetTaskService,
            update_task_service_1.UpdateTaskService,
            delete_task_service_1.DeleteTaskService,
        ],
        exports: [
            create_task_service_1.CreateTaskService,
            get_task_service_1.GetTaskService,
            update_task_service_1.UpdateTaskService,
            delete_task_service_1.DeleteTaskService,
        ],
    })
], TasksModule);


/***/ }),
/* 11 */
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
exports.TasksResolver = void 0;
const graphql_1 = __webpack_require__(5);
const create_task_service_1 = __webpack_require__(12);
const task_1 = __webpack_require__(14);
const get_task_service_1 = __webpack_require__(19);
const delete_task_service_1 = __webpack_require__(23);
const task_view_input_1 = __webpack_require__(24);
const create_task_input_1 = __webpack_require__(25);
const get_task_args_1 = __webpack_require__(26);
const update_task_service_1 = __webpack_require__(27);
const update_task_input_1 = __webpack_require__(28);
const role_decorator_1 = __webpack_require__(29);
const user_enum_1 = __webpack_require__(30);
let TasksResolver = class TasksResolver {
    constructor(createTaskService, getTaskService, deleteTaskService, updateTaskService) {
        this.createTaskService = createTaskService;
        this.getTaskService = getTaskService;
        this.deleteTaskService = deleteTaskService;
        this.updateTaskService = updateTaskService;
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
    async getTotalTasks() {
        return this.getTaskService.getTotalTasks();
    }
    async validateQuestionTask(id) {
        return this.updateTaskService.validateQuestionTask(id);
    }
};
exports.TasksResolver = TasksResolver;
__decorate([
    (0, graphql_1.Mutation)(() => task_view_input_1.TaskView),
    (0, role_decorator_1.Roles)(user_enum_1.Role.ADMIN, user_enum_1.Role.QUESTION_VALIDATOR),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof create_task_input_1.CreateTaskInput !== "undefined" && create_task_input_1.CreateTaskInput) === "function" ? _e : Object]),
    __metadata("design:returntype", typeof (_f = typeof Promise !== "undefined" && Promise) === "function" ? _f : Object)
], TasksResolver.prototype, "createTask", null);
__decorate([
    (0, graphql_1.Mutation)(() => task_view_input_1.TaskView),
    (0, role_decorator_1.Roles)(user_enum_1.Role.ADMIN, user_enum_1.Role.QUESTION_VALIDATOR),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_g = typeof update_task_input_1.UpdateTaskInput !== "undefined" && update_task_input_1.UpdateTaskInput) === "function" ? _g : Object]),
    __metadata("design:returntype", typeof (_h = typeof Promise !== "undefined" && Promise) === "function" ? _h : Object)
], TasksResolver.prototype, "updateTask", null);
__decorate([
    (0, graphql_1.Query)(() => task_view_input_1.TaskView),
    (0, role_decorator_1.Roles)(user_enum_1.Role.ADMIN, user_enum_1.Role.QUESTION_VALIDATOR, user_enum_1.Role.WORKER),
    __param(0, (0, graphql_1.Args)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], TasksResolver.prototype, "getTaskById", null);
__decorate([
    (0, graphql_1.Query)(() => [task_view_input_1.TaskView]),
    (0, role_decorator_1.Roles)(user_enum_1.Role.ADMIN, user_enum_1.Role.QUESTION_VALIDATOR, user_enum_1.Role.WORKER),
    __param(0, (0, graphql_1.Args)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof get_task_args_1.GetTaskArgs !== "undefined" && get_task_args_1.GetTaskArgs) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], TasksResolver.prototype, "getTasks", null);
__decorate([
    (0, graphql_1.Mutation)(() => task_view_input_1.TaskView),
    (0, role_decorator_1.Roles)(user_enum_1.Role.ADMIN, user_enum_1.Role.QUESTION_VALIDATOR),
    __param(0, (0, graphql_1.Args)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_m = typeof Promise !== "undefined" && Promise) === "function" ? _m : Object)
], TasksResolver.prototype, "deleteTask", null);
__decorate([
    (0, graphql_1.Query)(() => Number),
    (0, role_decorator_1.Roles)(user_enum_1.Role.WORKER, user_enum_1.Role.ADMIN, user_enum_1.Role.QUESTION_VALIDATOR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], TasksResolver.prototype, "getTotalTasks", null);
__decorate([
    (0, graphql_1.Mutation)(() => task_view_input_1.TaskView),
    (0, role_decorator_1.Roles)(user_enum_1.Role.QUESTION_VALIDATOR),
    __param(0, (0, graphql_1.Args)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_p = typeof Promise !== "undefined" && Promise) === "function" ? _p : Object)
], TasksResolver.prototype, "validateQuestionTask", null);
exports.TasksResolver = TasksResolver = __decorate([
    (0, graphql_1.Resolver)(() => task_1.Task),
    __metadata("design:paramtypes", [typeof (_a = typeof create_task_service_1.CreateTaskService !== "undefined" && create_task_service_1.CreateTaskService) === "function" ? _a : Object, typeof (_b = typeof get_task_service_1.GetTaskService !== "undefined" && get_task_service_1.GetTaskService) === "function" ? _b : Object, typeof (_c = typeof delete_task_service_1.DeleteTaskService !== "undefined" && delete_task_service_1.DeleteTaskService) === "function" ? _c : Object, typeof (_d = typeof update_task_service_1.UpdateTaskService !== "undefined" && update_task_service_1.UpdateTaskService) === "function" ? _d : Object])
], TasksResolver);


/***/ }),
/* 12 */
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
const common_1 = __webpack_require__(3);
const mongoose_1 = __webpack_require__(13);
const task_1 = __webpack_require__(14);
const gqlerr_1 = __webpack_require__(15);
const parser_1 = __webpack_require__(17);
const mongoose_2 = __webpack_require__(4);
const bson_1 = __webpack_require__(18);
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
/* 13 */
/***/ ((module) => {

module.exports = require("mongoose");

/***/ }),
/* 14 */
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
exports.TaskSchema = exports.Task = exports.GherkinsQuestion = exports.Answer = void 0;
const graphql_1 = __webpack_require__(5);
const mongoose_1 = __webpack_require__(4);
let Answer = class Answer {
};
exports.Answer = Answer;
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Number)
], Answer.prototype, "answerId", void 0);
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
let GherkinsQuestion = class GherkinsQuestion {
};
exports.GherkinsQuestion = GherkinsQuestion;
__decorate([
    (0, graphql_1.Field)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], GherkinsQuestion.prototype, "scenario", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], GherkinsQuestion.prototype, "given", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], GherkinsQuestion.prototype, "when", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], GherkinsQuestion.prototype, "then", void 0);
exports.GherkinsQuestion = GherkinsQuestion = __decorate([
    (0, graphql_1.ObjectType)()
], GherkinsQuestion);
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
    __metadata("design:type", GherkinsQuestion)
], Task.prototype, "question", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Boolean)
], Task.prototype, "isValidQuestion", void 0);
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
/* 15 */
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
const common_1 = __webpack_require__(3);
const type_1 = __webpack_require__(16);
__exportStar(__webpack_require__(16), exports);
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
/* 16 */
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
/* 17 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parseRequest = exports.parseToView = void 0;
const parseToView = (input) => {
    const answers = Array.isArray(input.answers) ? input.answers : [];
    return {
        id: input._id?.toString() || '',
        isValidQuestion: input.isValidQuestion,
        title: input.title,
        description: input.description,
        question: {
            scenario: input.question?.scenario || '',
            given: input.question?.given || '',
            when: input.question?.when || '',
            then: input.question?.then || '',
        },
        nAnswers: answers.length,
        answers,
    };
};
exports.parseToView = parseToView;
const parseRequest = (input) => {
    const answers = Array.isArray(input.answers) ? input.answers : [];
    return {
        title: input.title,
        description: input.description,
        isValidQuestion: false,
        question: {
            scenario: input.question?.scenario || '',
            given: input.question?.given || '',
            when: input.question?.when || '',
            then: input.question?.then || '',
        },
        answers,
        nAnswers: answers.length,
    };
};
exports.parseRequest = parseRequest;


/***/ }),
/* 18 */
/***/ ((module) => {

module.exports = require("bson");

/***/ }),
/* 19 */
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
exports.GetTaskService = void 0;
const common_1 = __webpack_require__(3);
const mongoose_1 = __webpack_require__(13);
const task_1 = __webpack_require__(14);
const gqlerr_1 = __webpack_require__(15);
const parser_1 = __webpack_require__(17);
const mongoose_2 = __webpack_require__(4);
const schedule_1 = __webpack_require__(20);
const get_recorded_service_1 = __webpack_require__(21);
let GetTaskService = class GetTaskService {
    constructor(taskModel, getRecordedAnswerService) {
        this.taskModel = taskModel;
        this.getRecordedAnswerService = getRecordedAnswerService;
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
            let query = this.taskModel.find();
            if (args?.skip != null) {
                query = query.skip(args.skip);
            }
            if (args?.take != null) {
                query = query.limit(args.take);
            }
            const res = await query;
            return res.map((task) => (0, parser_1.parseToView)(task));
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL(error, gqlerr_1.GQLThrowType.UNPROCESSABLE);
        }
    }
    async getValidatedTasks() {
        try {
            const tasks = await this.taskModel.find({ isValidQuestion: true });
            return tasks.map((task) => (0, parser_1.parseToView)(task));
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL(error, gqlerr_1.GQLThrowType.UNPROCESSABLE);
        }
    }
    async getTotalTasks() {
        try {
            return this.taskModel.countDocuments({ isValidQuestion: true });
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL(error, gqlerr_1.GQLThrowType.UNPROCESSABLE);
        }
    }
    async getTasksForMXProcessing() {
        try {
            return this.taskModel.find({ isValidQuestion: true });
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL(error, gqlerr_1.GQLThrowType.UNPROCESSABLE);
        }
    }
    async countAnswerStat() {
        try {
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
        catch (error) {
            console.error('Error in countAnswerStat:', error);
        }
    }
};
exports.GetTaskService = GetTaskService;
__decorate([
    (0, schedule_1.Cron)('*/10 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], GetTaskService.prototype, "countAnswerStat", null);
exports.GetTaskService = GetTaskService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(task_1.Task.name)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => get_recorded_service_1.GetRecordedAnswerService))),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_1.Model !== "undefined" && mongoose_1.Model) === "function" ? _a : Object, typeof (_b = typeof get_recorded_service_1.GetRecordedAnswerService !== "undefined" && get_recorded_service_1.GetRecordedAnswerService) === "function" ? _b : Object])
], GetTaskService);


/***/ }),
/* 20 */
/***/ ((module) => {

module.exports = require("@nestjs/schedule");

/***/ }),
/* 21 */
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
const common_1 = __webpack_require__(3);
const mongoose_1 = __webpack_require__(4);
const recorded_1 = __webpack_require__(22);
const mongoose_2 = __webpack_require__(13);
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
/* 22 */
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
const mongoose_1 = __webpack_require__(4);
const mongoose_2 = __webpack_require__(13);
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
    __metadata("design:type", Number)
], RecordedAnswer.prototype, "answerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], RecordedAnswer.prototype, "answer", void 0);
exports.RecordedAnswer = RecordedAnswer = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], RecordedAnswer);
exports.RecordedAnswerSchema = mongoose_1.SchemaFactory.createForClass(RecordedAnswer);


/***/ }),
/* 23 */
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
const common_1 = __webpack_require__(3);
const mongoose_1 = __webpack_require__(13);
const task_1 = __webpack_require__(14);
const gqlerr_1 = __webpack_require__(15);
const mongoose_2 = __webpack_require__(4);
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
/* 24 */
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
exports.TaskView = void 0;
const graphql_1 = __webpack_require__(5);
const task_1 = __webpack_require__(14);
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
    (0, graphql_1.Field)(() => task_1.GherkinsQuestion),
    __metadata("design:type", typeof (_a = typeof task_1.GherkinsQuestion !== "undefined" && task_1.GherkinsQuestion) === "function" ? _a : Object)
], TaskView.prototype, "question", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], TaskView.prototype, "nAnswers", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Boolean)
], TaskView.prototype, "isValidQuestion", void 0);
__decorate([
    (0, graphql_1.Field)(() => [task_1.Answer]),
    __metadata("design:type", Array)
], TaskView.prototype, "answers", void 0);
exports.TaskView = TaskView = __decorate([
    (0, graphql_1.ObjectType)()
], TaskView);


/***/ }),
/* 25 */
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
exports.CreateTaskInput = exports.GherkinsQuestionInput = exports.AnswerInput = void 0;
const graphql_1 = __webpack_require__(5);
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
let GherkinsQuestionInput = class GherkinsQuestionInput {
};
exports.GherkinsQuestionInput = GherkinsQuestionInput;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], GherkinsQuestionInput.prototype, "scenario", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], GherkinsQuestionInput.prototype, "given", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], GherkinsQuestionInput.prototype, "when", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], GherkinsQuestionInput.prototype, "then", void 0);
exports.GherkinsQuestionInput = GherkinsQuestionInput = __decorate([
    (0, graphql_1.InputType)()
], GherkinsQuestionInput);
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
    (0, graphql_1.Field)(() => GherkinsQuestionInput),
    __metadata("design:type", GherkinsQuestionInput)
], CreateTaskInput.prototype, "question", void 0);
__decorate([
    (0, graphql_1.Field)(() => [AnswerInput]),
    __metadata("design:type", Array)
], CreateTaskInput.prototype, "answers", void 0);
exports.CreateTaskInput = CreateTaskInput = __decorate([
    (0, graphql_1.InputType)()
], CreateTaskInput);


/***/ }),
/* 26 */
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
const graphql_1 = __webpack_require__(5);
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
/* 27 */
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
const common_1 = __webpack_require__(3);
const gqlerr_1 = __webpack_require__(15);
const task_1 = __webpack_require__(14);
const mongoose_1 = __webpack_require__(13);
const parser_1 = __webpack_require__(17);
const mongoose_2 = __webpack_require__(4);
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
    async validateQuestionTask(id) {
        try {
            const task = await this.taskModel.findById(id);
            if (!task) {
                throw new gqlerr_1.ThrowGQL('Task not found', gqlerr_1.GQLThrowType.NOT_FOUND);
            }
            task.isValidQuestion = true;
            await task.save();
            return (0, parser_1.parseToView)(task);
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
/* 28 */
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
const create_task_input_1 = __webpack_require__(25);
const graphql_1 = __webpack_require__(5);
let UpdateTaskInput = class UpdateTaskInput extends (0, graphql_1.PartialType)(create_task_input_1.CreateTaskInput) {
};
exports.UpdateTaskInput = UpdateTaskInput;
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], UpdateTaskInput.prototype, "id", void 0);
exports.UpdateTaskInput = UpdateTaskInput = __decorate([
    (0, graphql_1.InputType)()
], UpdateTaskInput);


/***/ }),
/* 29 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Roles = void 0;
const common_1 = __webpack_require__(3);
const Roles = (...roles) => (0, common_1.SetMetadata)('roles', roles);
exports.Roles = Roles;


/***/ }),
/* 30 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Role = exports.Gender = void 0;
const graphql_1 = __webpack_require__(5);
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
    Role["QUESTION_VALIDATOR"] = "question_validator";
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
/* 31 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UsersModule = void 0;
const common_1 = __webpack_require__(3);
const mongoose_1 = __webpack_require__(4);
const user_1 = __webpack_require__(32);
const users_resolver_1 = __webpack_require__(33);
const create_user_service_1 = __webpack_require__(36);
const get_user_service_1 = __webpack_require__(49);
const update_user_service_1 = __webpack_require__(37);
const delete_user_service_1 = __webpack_require__(34);
const mx_module_1 = __webpack_require__(54);
const eligibility_1 = __webpack_require__(39);
const tasks_module_1 = __webpack_require__(10);
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            (0, common_1.forwardRef)(() => mx_module_1.M1Module),
            (0, common_1.forwardRef)(() => tasks_module_1.TasksModule),
            mongoose_1.MongooseModule.forFeature([
                { name: user_1.Users.name, schema: user_1.UsersSchema },
                { name: eligibility_1.Eligibility.name, schema: eligibility_1.EligibilitySchema },
            ]),
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
/* 32 */
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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UsersSchema = exports.Users = exports.TaskCompletion = void 0;
const graphql_1 = __webpack_require__(5);
const mongoose_1 = __webpack_require__(4);
const user_enum_1 = __webpack_require__(30);
let TaskCompletion = class TaskCompletion {
};
exports.TaskCompletion = TaskCompletion;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], TaskCompletion.prototype, "taskId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], TaskCompletion.prototype, "answer", void 0);
exports.TaskCompletion = TaskCompletion = __decorate([
    (0, graphql_1.ObjectType)()
], TaskCompletion);
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
__decorate([
    (0, graphql_1.Field)(() => Boolean, { nullable: true }),
    (0, mongoose_1.Prop)({
        type: Boolean,
        required: false,
        default: null,
    }),
    __metadata("design:type", Boolean)
], Users.prototype, "isEligible", void 0);
__decorate([
    (0, graphql_1.Field)(() => [TaskCompletion]),
    (0, mongoose_1.Prop)({
        type: [{ taskId: String, answer: String }],
        required: function () {
            return this.role === 'worker';
        },
        default: [],
    }),
    __metadata("design:type", Array)
], Users.prototype, "completedTasks", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], Users.prototype, "createdAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], Users.prototype, "updatedAt", void 0);
exports.Users = Users = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true }),
    (0, graphql_1.ObjectType)()
], Users);
exports.UsersSchema = mongoose_1.SchemaFactory.createForClass(Users);
exports.UsersSchema.pre('findOneAndUpdate', function () {
    const update = this.getUpdate();
    if (update && update.$set && update.$set.isEligible !== undefined) {
        if (update.$set.isEligible !== null) {
            update.$set.isEligible = Boolean(update.$set.isEligible);
        }
    }
});


/***/ }),
/* 33 */
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UsersResolver = void 0;
const graphql_1 = __webpack_require__(5);
const user_1 = __webpack_require__(32);
const delete_user_service_1 = __webpack_require__(34);
const create_user_service_1 = __webpack_require__(36);
const update_user_service_1 = __webpack_require__(37);
const user_view_1 = __webpack_require__(45);
const create_user_input_1 = __webpack_require__(46);
const update_user_input_1 = __webpack_require__(47);
const graphql_2 = __webpack_require__(5);
const get_user_args_1 = __webpack_require__(48);
const get_user_service_1 = __webpack_require__(49);
const common_1 = __webpack_require__(3);
const role_decorator_1 = __webpack_require__(29);
const role_guard_1 = __webpack_require__(50);
const jwt_guard_1 = __webpack_require__(52);
const user_enum_1 = __webpack_require__(30);
const create_recorded_input_1 = __webpack_require__(53);
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
    async userHasDoneTask(input, userId) {
        return this.updateUserService.userHasDoneTask(input, userId);
    }
    async resetHasDoneTask(id) {
        return this.deleteUserService.resetHasDoneTask(id);
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
    async getTotalUsers() {
        return this.getUserService.getTotalUsers();
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
    (0, role_decorator_1.Roles)(user_enum_1.Role.ADMIN),
    __param(0, (0, graphql_1.Args)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], UsersResolver.prototype, "deleteUser", null);
__decorate([
    (0, graphql_1.Mutation)(() => user_view_1.UserView),
    (0, role_decorator_1.Roles)(user_enum_1.Role.WORKER),
    __param(0, (0, graphql_1.Args)('input')),
    __param(1, (0, graphql_1.Args)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof create_recorded_input_1.CreateRecordedAnswerInput !== "undefined" && create_recorded_input_1.CreateRecordedAnswerInput) === "function" ? _k : Object, String]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], UsersResolver.prototype, "userHasDoneTask", null);
__decorate([
    (0, graphql_1.Mutation)(() => user_view_1.UserView),
    (0, role_decorator_1.Roles)(user_enum_1.Role.WORKER),
    __param(0, (0, graphql_1.Args)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_m = typeof Promise !== "undefined" && Promise) === "function" ? _m : Object)
], UsersResolver.prototype, "resetHasDoneTask", null);
__decorate([
    (0, graphql_2.Query)(() => [user_view_1.UserView]),
    (0, role_decorator_1.Roles)(user_enum_1.Role.ADMIN),
    __param(0, (0, graphql_1.Args)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_o = typeof get_user_args_1.GetUserArgs !== "undefined" && get_user_args_1.GetUserArgs) === "function" ? _o : Object]),
    __metadata("design:returntype", typeof (_p = typeof Promise !== "undefined" && Promise) === "function" ? _p : Object)
], UsersResolver.prototype, "getAllUsers", null);
__decorate([
    (0, graphql_2.Query)(() => user_view_1.UserView),
    (0, role_decorator_1.Roles)(user_enum_1.Role.ADMIN),
    __param(0, (0, graphql_1.Args)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], UsersResolver.prototype, "getUserByUsername", null);
__decorate([
    (0, graphql_2.Query)(() => user_view_1.UserView),
    (0, role_decorator_1.Roles)(user_enum_1.Role.ADMIN),
    __param(0, (0, graphql_1.Args)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_r = typeof Promise !== "undefined" && Promise) === "function" ? _r : Object)
], UsersResolver.prototype, "getUserByEmail", null);
__decorate([
    (0, graphql_2.Query)(() => user_view_1.UserView),
    (0, role_decorator_1.Roles)(user_enum_1.Role.ADMIN),
    __param(0, (0, graphql_1.Args)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_s = typeof Promise !== "undefined" && Promise) === "function" ? _s : Object)
], UsersResolver.prototype, "getUserById", null);
__decorate([
    (0, graphql_2.Query)(() => Number),
    (0, role_decorator_1.Roles)(user_enum_1.Role.WORKER, user_enum_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_t = typeof Promise !== "undefined" && Promise) === "function" ? _t : Object)
], UsersResolver.prototype, "getTotalUsers", null);
exports.UsersResolver = UsersResolver = __decorate([
    (0, graphql_1.Resolver)(() => user_1.Users),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RolesGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof create_user_service_1.CreateUserService !== "undefined" && create_user_service_1.CreateUserService) === "function" ? _a : Object, typeof (_b = typeof update_user_service_1.UpdateUserService !== "undefined" && update_user_service_1.UpdateUserService) === "function" ? _b : Object, typeof (_c = typeof delete_user_service_1.DeleteUserService !== "undefined" && delete_user_service_1.DeleteUserService) === "function" ? _c : Object, typeof (_d = typeof get_user_service_1.GetUserService !== "undefined" && get_user_service_1.GetUserService) === "function" ? _d : Object])
], UsersResolver);


/***/ }),
/* 34 */
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
const common_1 = __webpack_require__(3);
const mongoose_1 = __webpack_require__(4);
const mongoose_2 = __webpack_require__(13);
const user_1 = __webpack_require__(32);
const gqlerr_1 = __webpack_require__(15);
const parser_1 = __webpack_require__(35);
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
    async resetHasDoneTask(id) {
        try {
            const updatedUser = await this.userModel.findByIdAndUpdate(id, { $set: { completedTasks: [] } }, { new: true });
            if (!updatedUser) {
                throw new gqlerr_1.ThrowGQL('User not found', gqlerr_1.GQLThrowType.NOT_FOUND);
            }
            return (0, parser_1.parseToView)(updatedUser);
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
/* 35 */
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
        completedTasks: input.completedTasks,
        isEligible: input.isEligible,
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
/* 36 */
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
const common_1 = __webpack_require__(3);
const mongoose_1 = __webpack_require__(4);
const mongoose_2 = __webpack_require__(13);
const user_1 = __webpack_require__(32);
const bson_1 = __webpack_require__(18);
const parser_1 = __webpack_require__(35);
const gqlerr_1 = __webpack_require__(15);
let CreateUserService = class CreateUserService {
    constructor(userModel) {
        this.userModel = userModel;
    }
    async create(createUserInput) {
        try {
            const isEligible = null;
            const user = await new this.userModel({
                _id: new bson_1.ObjectId(),
                ...createUserInput,
                isEligible,
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
/* 37 */
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
var UpdateUserService_1;
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateUserService = void 0;
const common_1 = __webpack_require__(3);
const mongoose_1 = __webpack_require__(4);
const mongoose_2 = __webpack_require__(13);
const user_1 = __webpack_require__(32);
const gqlerr_1 = __webpack_require__(15);
const parser_1 = __webpack_require__(35);
const schedule_1 = __webpack_require__(20);
const get_eligibility_service_1 = __webpack_require__(38);
const eligibility_1 = __webpack_require__(39);
const utils_service_1 = __webpack_require__(41);
const get_task_service_1 = __webpack_require__(19);
const mx_calculation_service_1 = __webpack_require__(43);
let UpdateUserService = UpdateUserService_1 = class UpdateUserService {
    constructor(userModel, eligibilityModel, getEligibilityService, getTaskService, utilsService, accuracyCalculationService) {
        this.userModel = userModel;
        this.eligibilityModel = eligibilityModel;
        this.getEligibilityService = getEligibilityService;
        this.getTaskService = getTaskService;
        this.utilsService = utilsService;
        this.accuracyCalculationService = accuracyCalculationService;
        this.logger = new common_1.Logger(UpdateUserService_1.name);
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
    async userHasDoneTask(input, userId) {
        try {
            const { taskId, answer } = input;
            const user = await this.userModel.findById(userId);
            if (!user) {
                throw new gqlerr_1.ThrowGQL('User not found', gqlerr_1.GQLThrowType.NOT_FOUND);
            }
            if (!user.completedTasks.some((t) => t.taskId === taskId)) {
                const updatedUser = await this.userModel.findByIdAndUpdate(userId, { $push: { completedTasks: { taskId, answer } } }, { new: true });
                const totalTasks = await this.getTaskService.getTotalTasks();
                const completedCount = updatedUser.completedTasks?.length || 0;
                this.logger.log(`User ${userId} completed task ${taskId}. Progress: ${completedCount}/${totalTasks} tasks completed.`);
                if (completedCount >= totalTasks) {
                    this.logger.log(`User ${userId} has completed ALL ${totalTasks} tasks! Ready for M-X algorithm processing.`);
                }
                return (0, parser_1.parseToView)(updatedUser);
            }
            return (0, parser_1.parseToView)(user);
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL(error, gqlerr_1.GQLThrowType.UNPROCESSABLE);
        }
    }
    async qualifyAllUsers() {
        try {
            this.logger.log('Starting worker requalification process...');
            const totalTasks = await this.getTaskService.getTotalTasks();
            this.logger.log(`Total tasks in system: ${totalTasks}`);
            const allWorkers = await this.userModel
                .find({ role: 'worker' })
                .sort({ createdAt: 1 })
                .exec();
            this.logger.log(`Total workers found: ${allWorkers.length}`);
            const eligibleForRequalification = allWorkers.filter((worker) => worker.completedTasks && worker.completedTasks.length >= totalTasks);
            this.logger.log(`Workers who completed all ${totalTasks} tasks: ${eligibleForRequalification.length}`);
            if (eligibleForRequalification.length === 0) {
                this.logger.log('No workers have completed all tasks yet. Skipping requalification.');
                return;
            }
            const workersWithEligibility = new Map();
            let processedWorkersCount = 0;
            for (const user of eligibleForRequalification) {
                const userIdStr = user._id.toString();
                const eligibilities = await this.getEligibilityService.getEligibilityWorkerId(userIdStr);
                if (eligibilities.length > 0) {
                    const totalAccuracy = eligibilities.reduce((sum, e) => sum + (e.accuracy || 0), 0);
                    const averageAccuracy = totalAccuracy / eligibilities.length;
                    workersWithEligibility.set(userIdStr, averageAccuracy);
                    processedWorkersCount++;
                    this.logger.debug(`Worker ${userIdStr} (${user.firstName} ${user.lastName}) has ${eligibilities.length} eligibility records, average accuracy: ${averageAccuracy.toFixed(3)}`);
                }
            }
            this.logger.log(`Workers with eligibility records (processed by M-X): ${processedWorkersCount}/${eligibleForRequalification.length}`);
            if (processedWorkersCount === 0) {
                this.logger.log('No workers have eligibility records yet. M-X algorithm still processing...');
                return;
            }
            const allAccuracyValues = Array.from(workersWithEligibility.values());
            const threshold = await this.utilsService.calculateThreshold(allAccuracyValues);
            const thresholdRounded = Number(threshold.toFixed(3));
            this.logger.log(`Calculated threshold: ${thresholdRounded.toFixed(3)} (based on ${allAccuracyValues.length} processed workers)`);
            let updatedCount = 0;
            let eligibleCount = 0;
            let notEligibleCount = 0;
            let pendingCount = 0;
            for (const user of eligibleForRequalification) {
                const userIdStr = user._id.toString();
                if (user.isEligible !== null && user.isEligible !== undefined) {
                    if (user.isEligible) {
                        eligibleCount++;
                    }
                    else {
                        notEligibleCount++;
                    }
                    continue;
                }
                if (!workersWithEligibility.has(userIdStr)) {
                    await this.userModel.findByIdAndUpdate(userIdStr, {
                        $set: { isEligible: null },
                    });
                    pendingCount++;
                    this.logger.debug(`Worker ${userIdStr} (${user.firstName} ${user.lastName}) set as pending (M-X processing not complete)`);
                    continue;
                }
                const averageAccuracy = workersWithEligibility.get(userIdStr);
                const averageAccuracyRounded = Number(averageAccuracy.toFixed(3));
                const isEligible = averageAccuracyRounded > thresholdRounded;
                await this.userModel.findByIdAndUpdate(userIdStr, {
                    $set: { isEligible },
                });
                updatedCount++;
                if (isEligible) {
                    eligibleCount++;
                }
                else {
                    notEligibleCount++;
                }
                this.logger.log(`Updated worker ${userIdStr} (${user.firstName} ${user.lastName}): ${isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'} (accuracy: ${averageAccuracyRounded.toFixed(3)}, threshold: ${thresholdRounded.toFixed(3)})`);
            }
            this.logger.log(`Requalification completed. Updated: ${updatedCount}, Eligible: ${eligibleCount}, Not Eligible: ${notEligibleCount}, Pending: ${pendingCount}. Threshold: ${thresholdRounded.toFixed(3)}`);
        }
        catch (error) {
            this.logger.error(`Error in qualifyAllUsers: ${error.message}`);
            throw new gqlerr_1.ThrowGQL(error.message, gqlerr_1.GQLThrowType.UNPROCESSABLE);
        }
    }
};
exports.UpdateUserService = UpdateUserService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UpdateUserService.prototype, "qualifyAllUsers", null);
exports.UpdateUserService = UpdateUserService = UpdateUserService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_1.Users.name)),
    __param(1, (0, mongoose_1.InjectModel)(eligibility_1.Eligibility.name)),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => get_task_service_1.GetTaskService))),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => mx_calculation_service_1.AccuracyCalculationServiceMX))),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object, typeof (_b = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _b : Object, typeof (_c = typeof get_eligibility_service_1.GetEligibilityService !== "undefined" && get_eligibility_service_1.GetEligibilityService) === "function" ? _c : Object, typeof (_d = typeof get_task_service_1.GetTaskService !== "undefined" && get_task_service_1.GetTaskService) === "function" ? _d : Object, typeof (_e = typeof utils_service_1.UtilsService !== "undefined" && utils_service_1.UtilsService) === "function" ? _e : Object, typeof (_f = typeof mx_calculation_service_1.AccuracyCalculationServiceMX !== "undefined" && mx_calculation_service_1.AccuracyCalculationServiceMX) === "function" ? _f : Object])
], UpdateUserService);


/***/ }),
/* 38 */
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
exports.GetEligibilityService = void 0;
const common_1 = __webpack_require__(3);
const mongoose_1 = __webpack_require__(4);
const mongoose_2 = __webpack_require__(13);
const eligibility_1 = __webpack_require__(39);
const gqlerr_1 = __webpack_require__(15);
const parser_1 = __webpack_require__(40);
let GetEligibilityService = class GetEligibilityService {
    constructor(eligibilityModel) {
        this.eligibilityModel = eligibilityModel;
    }
    async getEligibility() {
        try {
            const res = await this.eligibilityModel.find();
            return res.map((result) => (0, parser_1.parseToViewEligibility)(result));
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL('Error getting eligibility', gqlerr_1.GQLThrowType.NOT_FOUND);
        }
    }
    async getEligibilityById(eligibilityId) {
        try {
            const res = await this.eligibilityModel.findById(eligibilityId);
            if (!res) {
                throw new gqlerr_1.ThrowGQL('Eligibility not found', gqlerr_1.GQLThrowType.NOT_FOUND);
            }
            return (0, parser_1.parseToViewEligibility)(res);
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL('Error getting eligibility', gqlerr_1.GQLThrowType.NOT_FOUND);
        }
    }
    async getEligibilityWorkerId(workerId) {
        try {
            const results = await this.eligibilityModel.find({ workerId });
            return results.map((result) => (0, parser_1.parseToViewEligibility)(result));
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL('Error getting eligibility', gqlerr_1.GQLThrowType.NOT_FOUND);
        }
    }
    async getElibilityAndUpdate(eligibilityId, update) {
        try {
            const res = await this.eligibilityModel.findByIdAndUpdate(eligibilityId, update, { new: true });
            if (!res) {
                throw new gqlerr_1.ThrowGQL('Eligibility not found', gqlerr_1.GQLThrowType.NOT_FOUND);
            }
            return (0, parser_1.parseToViewEligibility)(res);
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL(`Error ${error}`, gqlerr_1.GQLThrowType.NOT_FOUND);
        }
    }
};
exports.GetEligibilityService = GetEligibilityService;
exports.GetEligibilityService = GetEligibilityService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(eligibility_1.Eligibility.name)),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object])
], GetEligibilityService);


/***/ }),
/* 39 */
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
exports.EligibilitySchema = exports.Eligibility = void 0;
const graphql_1 = __webpack_require__(5);
const mongoose_1 = __webpack_require__(4);
const mongoose_2 = __webpack_require__(13);
let Eligibility = class Eligibility {
};
exports.Eligibility = Eligibility;
__decorate([
    (0, graphql_1.Field)(() => String),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Task', required: true }),
    __metadata("design:type", String)
], Eligibility.prototype, "taskId", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", String)
], Eligibility.prototype, "workerId", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Number)
], Eligibility.prototype, "accuracy", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Eligibility.prototype, "createdAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], Eligibility.prototype, "updatedAt", void 0);
exports.Eligibility = Eligibility = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true }),
    (0, graphql_1.ObjectType)()
], Eligibility);
exports.EligibilitySchema = mongoose_1.SchemaFactory.createForClass(Eligibility);


/***/ }),
/* 40 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parseToViewEligibility = void 0;
const parseToViewEligibility = (input) => {
    return {
        id: input._id,
        workerId: input.workerId,
        accuracy: input.accuracy,
        feedback: input.feedback,
        Date: input.Date,
        taskId: input.taskId,
    };
};
exports.parseToViewEligibility = parseToViewEligibility;


/***/ }),
/* 41 */
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
var UtilsService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UtilsService = void 0;
const common_1 = __webpack_require__(3);
const mongoose_1 = __webpack_require__(4);
const mongoose_2 = __webpack_require__(13);
const gqlerr_1 = __webpack_require__(15);
const utils_1 = __webpack_require__(42);
const eligibility_1 = __webpack_require__(39);
let UtilsService = UtilsService_1 = class UtilsService {
    constructor(utilsModel, eligibilityModel) {
        this.utilsModel = utilsModel;
        this.eligibilityModel = eligibilityModel;
        this.logger = new common_1.Logger(UtilsService_1.name);
        this.initializeUtils();
    }
    async initializeUtils() {
        try {
            const count = await this.utilsModel.countDocuments().exec();
            if (count === 0) {
                await this.utilsModel.create({
                    thresholdType: utils_1.ThresholdType.MEDIAN,
                    thresholdValue: 0.7,
                    lastUpdated: new Date(),
                });
                this.logger.log('Created default utils configuration');
            }
        }
        catch (error) {
            this.logger.error('Failed to initialize utils configuration', error);
        }
    }
    async getThresholdSettings() {
        try {
            let utils = await this.utilsModel.findOne().exec();
            if (!utils) {
                utils = await this.utilsModel.create({
                    thresholdType: utils_1.ThresholdType.MEDIAN,
                    thresholdValue: 0.7,
                    lastUpdated: new Date(),
                });
            }
            return utils;
        }
        catch (error) {
            this.logger.error('Failed to get threshold settings', error);
            throw new gqlerr_1.ThrowGQL('Failed to get threshold settings', gqlerr_1.GQLThrowType.UNEXPECTED);
        }
    }
    async updateThresholdSettings(thresholdType, thresholdValue) {
        try {
            if (thresholdType === utils_1.ThresholdType.CUSTOM) {
                if (thresholdValue === undefined) {
                    throw new gqlerr_1.ThrowGQL('Threshold value must be provided when type is custom', gqlerr_1.GQLThrowType.BAD_REQUEST);
                }
                if (thresholdValue < 0 || thresholdValue > 1) {
                    throw new gqlerr_1.ThrowGQL('Threshold value must be between 0 and 1', gqlerr_1.GQLThrowType.BAD_REQUEST);
                }
            }
            const updateData = {
                thresholdType,
                lastUpdated: new Date(),
            };
            if (thresholdType === utils_1.ThresholdType.MEDIAN ||
                thresholdType === utils_1.ThresholdType.MEAN) {
                const allAccuracies = await this.getAllWorkerAccuracies();
                const calculatedThreshold = thresholdType === utils_1.ThresholdType.MEDIAN
                    ? this.calculateMedian(allAccuracies)
                    : this.calculateMean(allAccuracies);
                updateData.thresholdValue = calculatedThreshold;
            }
            else if (thresholdValue !== undefined) {
                updateData.thresholdValue = thresholdValue;
            }
            const utils = await this.utilsModel.findOneAndUpdate({}, { $set: updateData }, { upsert: true, new: true });
            this.logger.log(`Updated threshold settings: type=${thresholdType}, value=${utils.thresholdValue}`);
            return utils;
        }
        catch (error) {
            if (error instanceof gqlerr_1.ThrowGQL) {
                throw error;
            }
            this.logger.error('Failed to update threshold settings', error);
            throw new gqlerr_1.ThrowGQL('Failed to update threshold settings', gqlerr_1.GQLThrowType.UNEXPECTED);
        }
    }
    async getAllWorkerAccuracies() {
        try {
            const eligibilityRecords = await this.eligibilityModel.find().exec();
            if (eligibilityRecords.length === 0) {
                return [0.7];
            }
            const workerAccuracies = new Map();
            for (const record of eligibilityRecords) {
                const workerId = record.workerId.toString();
                const accuracy = record.accuracy || 0;
                if (!workerAccuracies.has(workerId)) {
                    workerAccuracies.set(workerId, []);
                }
                workerAccuracies.get(workerId)?.push(accuracy);
            }
            const averageAccuracies = [];
            for (const accuracies of workerAccuracies.values()) {
                if (accuracies.length > 0) {
                    const avgAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
                    averageAccuracies.push(avgAccuracy);
                }
            }
            return averageAccuracies.length > 0 ? averageAccuracies : [0.7];
        }
        catch (error) {
            this.logger.error('Error getting worker accuracies', error);
            return [0.7];
        }
    }
    async calculateThreshold(accuracyValues) {
        try {
            if (!accuracyValues || accuracyValues.length === 0) {
                return 0.7;
            }
            const settings = await this.getThresholdSettings();
            switch (settings.thresholdType) {
                case utils_1.ThresholdType.MEDIAN: {
                    return this.calculateMedian(accuracyValues);
                }
                case utils_1.ThresholdType.MEAN: {
                    return this.calculateMean(accuracyValues);
                }
                case utils_1.ThresholdType.CUSTOM: {
                    return settings.thresholdValue;
                }
                default:
                    return this.calculateMedian(accuracyValues);
            }
        }
        catch (error) {
            this.logger.error('Failed to calculate threshold', error);
            return 0.7;
        }
    }
    calculateMedian(values) {
        if (values.length === 0)
            return 0.7;
        const sorted = [...values].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 1) {
            return sorted[middle];
        }
        return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    calculateMean(values) {
        if (values.length === 0)
            return 0.7;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    async updateGlobalThreshold(newThreshold) {
        try {
            const utils = await this.utilsModel.findOneAndUpdate({}, {
                $set: {
                    thresholdValue: newThreshold,
                    lastUpdated: new Date(),
                },
            }, { upsert: true, new: true });
            this.logger.log(`Global threshold updated to: ${newThreshold.toFixed(3)}`);
            return utils;
        }
        catch (error) {
            this.logger.error('Failed to update global threshold', error);
            throw new gqlerr_1.ThrowGQL('Failed to update global threshold', gqlerr_1.GQLThrowType.UNEXPECTED);
        }
    }
    calculateWeightedThreshold(eligibilityRecords) {
        if (!eligibilityRecords || eligibilityRecords.length === 0) {
            return 0.7;
        }
        const workerAccuracies = new Map();
        for (const record of eligibilityRecords) {
            const workerId = record.workerId.toString();
            const accuracy = record.accuracy || 0;
            if (!workerAccuracies.has(workerId)) {
                workerAccuracies.set(workerId, []);
            }
            workerAccuracies.get(workerId)?.push(accuracy);
        }
        const workerAverages = [];
        for (const accuracies of workerAccuracies.values()) {
            if (accuracies.length > 0) {
                const avgAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
                workerAverages.push(avgAccuracy);
            }
        }
        return this.calculateMedian(workerAverages);
    }
    async processBatchIsolated(workerSubmissions) {
        try {
            const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const timestamp = new Date();
            this.logger.log(`Processing isolated batch: ${batchId} with ${workerSubmissions.length} submissions`);
            const currentThreshold = await this.getCurrentThreshold();
            let processedCount = 0;
            for (const submission of workerSubmissions) {
                try {
                    const existingRecord = await this.eligibilityModel.findOne({
                        workerId: submission.workerId,
                        taskId: submission.taskId,
                    });
                    if (!existingRecord) {
                        await this.eligibilityModel.create({
                            workerId: submission.workerId,
                            taskId: submission.taskId,
                            accuracy: submission.accuracy,
                        });
                        processedCount++;
                        this.logger.debug(`Created eligibility record for worker ${submission.workerId} with accuracy ${submission.accuracy.toFixed(3)}`);
                    }
                }
                catch (error) {
                    this.logger.error(`Error processing submission for worker ${submission.workerId}:`, error);
                }
            }
            this.logger.log(`Batch ${batchId} processed: ${processedCount}/${workerSubmissions.length} new records created`);
            return {
                processedCount,
                threshold: currentThreshold,
                batchId,
                timestamp,
            };
        }
        catch (error) {
            this.logger.error('Error processing isolated batch', error);
            throw new gqlerr_1.ThrowGQL('Failed to process isolated batch', gqlerr_1.GQLThrowType.UNEXPECTED);
        }
    }
    async performGlobalRecalibration() {
        try {
            this.logger.log('Starting periodic global recalibration...');
            const oldSettings = await this.getThresholdSettings();
            const oldThreshold = oldSettings.thresholdValue;
            const allRecords = await this.eligibilityModel.find().exec();
            if (allRecords.length === 0) {
                this.logger.warn('No eligibility records found for recalibration');
                return {
                    oldThreshold,
                    newThreshold: oldThreshold,
                    affectedWorkers: 0,
                    recalibrationReason: 'No data available',
                    timestamp: new Date(),
                };
            }
            const newThreshold = this.calculateWeightedThreshold(allRecords);
            await this.updateGlobalThreshold(newThreshold);
            const uniqueWorkers = new Set(allRecords.map((r) => r.workerId.toString())).size;
            const recalibrationReason = `Periodic recalibration based on ${allRecords.length} eligibility records`;
            this.logger.log(`Global recalibration completed: ${oldThreshold.toFixed(3)} -> ${newThreshold.toFixed(3)}, ${uniqueWorkers} workers in system`);
            return {
                oldThreshold,
                newThreshold,
                affectedWorkers: uniqueWorkers,
                recalibrationReason,
                timestamp: new Date(),
            };
        }
        catch (error) {
            this.logger.error('Error performing global recalibration', error);
            throw new gqlerr_1.ThrowGQL('Failed to perform global recalibration', gqlerr_1.GQLThrowType.UNEXPECTED);
        }
    }
    async shouldPerformGlobalRecalibration() {
        try {
            const settings = await this.getThresholdSettings();
            const lastUpdated = settings.lastUpdated || new Date(0);
            const currentTime = new Date();
            const timeSinceLastUpdate = currentTime.getTime() - lastUpdated.getTime();
            const RECALIBRATION_INTERVAL = 24 * 60 * 60 * 1000;
            const NEW_RECORDS_THRESHOLD = 50;
            if (timeSinceLastUpdate > RECALIBRATION_INTERVAL) {
                return {
                    needed: true,
                    reason: `24 hours have passed since last recalibration (${Math.floor(timeSinceLastUpdate / (60 * 60 * 1000))} hours ago)`,
                    timeSinceLastUpdate,
                    newRecordsCount: 0,
                };
            }
            const newRecordsCount = await this.eligibilityModel.countDocuments({
                createdAt: { $gte: lastUpdated },
            });
            if (newRecordsCount >= NEW_RECORDS_THRESHOLD) {
                return {
                    needed: true,
                    reason: `${newRecordsCount} new eligibility records since last recalibration`,
                    timeSinceLastUpdate,
                    newRecordsCount,
                };
            }
            return {
                needed: false,
                reason: 'Recalibration criteria not met',
                timeSinceLastUpdate,
                newRecordsCount,
            };
        }
        catch (error) {
            this.logger.error('Error checking recalibration status', error);
            return {
                needed: false,
                reason: 'Error checking recalibration status',
                timeSinceLastUpdate: 0,
                newRecordsCount: 0,
            };
        }
    }
    async getCurrentThreshold() {
        try {
            const settings = await this.getThresholdSettings();
            return settings.thresholdValue;
        }
        catch (error) {
            this.logger.error('Error getting current threshold', error);
            return 0.7;
        }
    }
};
exports.UtilsService = UtilsService;
exports.UtilsService = UtilsService = UtilsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(utils_1.Utils.name)),
    __param(1, (0, mongoose_1.InjectModel)(eligibility_1.Eligibility.name)),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object, typeof (_b = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _b : Object])
], UtilsService);


/***/ }),
/* 42 */
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
exports.UtilsSchema = exports.Utils = exports.ThresholdType = void 0;
const graphql_1 = __webpack_require__(5);
const mongoose_1 = __webpack_require__(4);
var ThresholdType;
(function (ThresholdType) {
    ThresholdType["MEDIAN"] = "median";
    ThresholdType["MEAN"] = "mean";
    ThresholdType["CUSTOM"] = "custom";
})(ThresholdType || (exports.ThresholdType = ThresholdType = {}));
let Utils = class Utils {
};
exports.Utils = Utils;
__decorate([
    (0, graphql_1.Field)(() => String),
    (0, mongoose_1.Prop)({
        type: String,
        enum: ThresholdType,
        default: ThresholdType.MEDIAN,
    }),
    __metadata("design:type", String)
], Utils.prototype, "thresholdType", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, mongoose_1.Prop)({ default: 0.7 }),
    __metadata("design:type", Number)
], Utils.prototype, "thresholdValue", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date),
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Utils.prototype, "lastUpdated", void 0);
exports.Utils = Utils = __decorate([
    (0, mongoose_1.Schema)(),
    (0, graphql_1.ObjectType)()
], Utils);
exports.UtilsSchema = mongoose_1.SchemaFactory.createForClass(Utils);


/***/ }),
/* 43 */
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
var AccuracyCalculationServiceMX_1;
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AccuracyCalculationServiceMX = void 0;
const common_1 = __webpack_require__(3);
const get_task_service_1 = __webpack_require__(19);
const mongoose_1 = __webpack_require__(4);
const mongoose_2 = __webpack_require__(13);
const recorded_1 = __webpack_require__(22);
const gqlerr_1 = __webpack_require__(15);
const create_eligibility_service_1 = __webpack_require__(44);
const user_1 = __webpack_require__(32);
const utils_service_1 = __webpack_require__(41);
let AccuracyCalculationServiceMX = AccuracyCalculationServiceMX_1 = class AccuracyCalculationServiceMX {
    constructor(recordedAnswerModel, userModel, createEligibilityService, getTaskService, utilsService) {
        this.recordedAnswerModel = recordedAnswerModel;
        this.userModel = userModel;
        this.createEligibilityService = createEligibilityService;
        this.getTaskService = getTaskService;
        this.utilsService = utilsService;
        this.logger = new common_1.Logger(AccuracyCalculationServiceMX_1.name);
        this.batchTrackers = new Map();
    }
    async processWorkerSubmission(taskId, workerId) {
        this.logger.log(`Processing worker submission: taskId=${taskId}, workerId=${workerId}`);
        const completedWorkers = await this.getCompletedWorkers();
        this.logger.log(`Total workers who completed all tasks: ${completedWorkers.length}`);
        const user = await this.userModel.findById(workerId);
        const totalTasks = await this.getTaskService.getTotalTasks();
        this.logger.log(`Worker ${workerId} - CompletedTasks: ${user?.completedTasks?.length || 0}/${totalTasks}, TotalValidTasks: ${totalTasks}`);
        if (!user || (user.completedTasks?.length || 0) < totalTasks) {
            this.logger.debug(`Worker ${workerId} has not completed all tasks yet. Skipping M-X processing.`);
            return;
        }
        if (!this.batchTrackers.has(taskId)) {
            this.batchTrackers.set(taskId, {
                taskId,
                processedWorkers: new Set(),
                pendingWorkers: [],
                lastProcessedBatch: 0,
            });
        }
        const tracker = this.batchTrackers.get(taskId);
        if (tracker.processedWorkers.has(workerId)) {
            this.logger.debug(`Worker ${workerId} already processed for task ${taskId}`);
            return;
        }
        const workersWithAnswers = await this.recordedAnswerModel.distinct('workerId', {
            taskId,
            workerId: { $in: completedWorkers },
        });
        const eligibleForProcessing = workersWithAnswers.filter((id) => !tracker.processedWorkers.has(id.toString()));
        this.logger.log(`Task ${taskId}: ${eligibleForProcessing.length} completed workers with answers eligible for processing`);
        if (eligibleForProcessing.length >= 3) {
            this.logger.log(`Processing M-X batch for task ${taskId} with ${eligibleForProcessing.length} completed workers`);
            await this.processBatch(taskId, tracker, eligibleForProcessing.map((id) => id.toString()));
        }
        else {
            await this.setPendingStatusForAll(eligibleForProcessing.map((id) => id.toString()));
            this.logger.log(`Task ${taskId}: Setting ${eligibleForProcessing.length} workers as pending (need ${3 - eligibleForProcessing.length} more for batch processing)`);
        }
    }
    async getCompletedWorkers() {
        try {
            const totalTasks = await this.getTaskService.getTotalTasks();
            const completedWorkers = await this.userModel.aggregate([
                { $match: { role: 'worker' } },
                {
                    $addFields: {
                        completedTasksCount: {
                            $size: { $ifNull: ['$completedTasks', []] },
                        },
                    },
                },
                { $match: { completedTasksCount: { $gte: totalTasks } } },
                { $project: { _id: 1 } },
            ]);
            const workerIds = completedWorkers.map((w) => w._id.toString());
            this.logger.debug(`Found ${workerIds.length} workers who completed all ${totalTasks} tasks`);
            return workerIds;
        }
        catch (error) {
            this.logger.error('Error getting completed workers:', error);
            return [];
        }
    }
    async setPendingStatusForAll(workerIds) {
        if (workerIds.length === 0)
            return;
        try {
            await this.userModel.updateMany({ _id: { $in: workerIds } }, { $set: { isEligible: null } });
            this.logger.debug(`Set ${workerIds.length} workers to pending status: ${workerIds.join(', ')}`);
        }
        catch (error) {
            this.logger.error('Error setting pending status:', error);
        }
    }
    async processBatch(taskId, tracker, completedWorkerIds) {
        this.logger.log(`Processing batch for task ${taskId} with ${completedWorkerIds.length} completed workers`);
        const task = await this.getTaskService.getTaskById(taskId);
        if (!task) {
            throw new gqlerr_1.ThrowGQL(`Task with ID ${taskId} not found`, gqlerr_1.GQLThrowType.NOT_FOUND);
        }
        const allAnswers = await this.recordedAnswerModel.find({
            taskId,
            workerId: { $in: completedWorkerIds },
        });
        if (allAnswers.length === 0) {
            this.logger.warn(`No answers found for task ${taskId} from completed workers`);
            return;
        }
        const allWorkerIds = Array.from(new Set(allAnswers.map((a) => a.workerId.toString())));
        if (allWorkerIds.length < 3) {
            this.logger.warn(`Insufficient completed workers with answers (${allWorkerIds.length}) for M-X calculation`);
            await this.setPendingStatusForAll(allWorkerIds);
            return;
        }
        this.logger.log(`Calculating M-X accuracy for ${allWorkerIds.length} completed workers`);
        const accuracies = await this.calculateAccuracyMX(taskId, allWorkerIds);
        const workerSubmissions = allWorkerIds.map((workerId) => ({
            workerId: workerId,
            taskId: taskId,
            accuracy: accuracies[workerId],
        }));
        try {
            const batchResult = await this.utilsService.processBatchIsolated(workerSubmissions);
            this.logger.log(`Batch processing completed for task ${taskId}. ` +
                `Processed: ${batchResult.processedCount}/${workerSubmissions.length} records. ` +
                `Batch ID: ${batchResult.batchId}, Threshold: ${batchResult.threshold.toFixed(3)}`);
        }
        catch (error) {
            this.logger.error('Error in batch processing, falling back to individual creation:', error);
            for (const workerId of allWorkerIds) {
                try {
                    const accuracy = accuracies[workerId];
                    const eligibilityInput = {
                        taskId: taskId,
                        workerId: workerId,
                        accuracy: accuracy,
                    };
                    await this.createEligibilityService.createEligibility(eligibilityInput);
                    this.logger.debug(`Created/updated eligibility for worker ${workerId}: accuracy=${accuracy.toFixed(3)}`);
                }
                catch (individualError) {
                    this.logger.error(`Error creating eligibility for worker ${workerId}:`, individualError);
                }
            }
        }
        allWorkerIds.forEach((id) => tracker.processedWorkers.add(id));
        tracker.pendingWorkers = tracker.pendingWorkers.filter((id) => !allWorkerIds.includes(id));
        tracker.lastProcessedBatch = Date.now();
        this.logger.log(`Batch processing completed for task ${taskId}. Total processed workers: ${tracker.processedWorkers.size}`);
    }
    async calculateAccuracyMX(taskId, workers) {
        this.logger.log(`Starting M-X accuracy calculation for taskId: ${taskId}`);
        const task = await this.getTaskService.getTaskById(taskId);
        if (!task) {
            throw new gqlerr_1.ThrowGQL(`Task with ID ${taskId} not found`, gqlerr_1.GQLThrowType.NOT_FOUND);
        }
        const M = task.nAnswers || 4;
        const answers = await this.recordedAnswerModel.find({ taskId });
        if (answers.length === 0 || workers.length < 3) {
            this.logger.warn(`Insufficient data for M-X calculation`);
            return workers.reduce((acc, workerId) => {
                acc[workerId] = 1 / M;
                return acc;
            }, {});
        }
        const workerAnswersMap = {};
        for (const workerId of workers) {
            const workerRecords = answers.filter((a) => a.workerId.toString() === workerId);
            workerAnswersMap[workerId] = workerRecords.map((record) => ({
                answerId: record.answerId,
                answer: record.answer,
            }));
        }
        const finalAccuracies = {};
        const answerIds = Array.from(new Set(answers.map((a) => a.answerId))).sort((a, b) => a - b);
        if (answerIds.length === 0) {
            this.logger.warn('No answer IDs found');
            return workers.reduce((acc, workerId) => {
                acc[workerId] = 1 / M;
                return acc;
            }, {});
        }
        for (let i = 0; i < workers.length; i++) {
            const currentWorkerId = workers[i];
            let workerAccuracy = 0;
            let validWindowCount = 0;
            const numWindows = Math.min(workers.length - 2, workers.length);
            for (let j = 0; j < numWindows; j++) {
                const windowWorkers = [
                    workers[(i + j) % workers.length],
                    workers[(i + j + 1) % workers.length],
                    workers[(i + j + 2) % workers.length],
                ];
                const uniqueWorkers = new Set(windowWorkers);
                if (uniqueWorkers.size < 3 ||
                    !windowWorkers.includes(currentWorkerId)) {
                    continue;
                }
                this.logger.debug(`Window ${j} for worker ${currentWorkerId}: [${windowWorkers.join(', ')}]`);
                const windowAccuracy = this.calculateMXAccuracyForWindow(windowWorkers, currentWorkerId, workerAnswersMap, answerIds, M);
                if (windowAccuracy !== null) {
                    workerAccuracy += windowAccuracy;
                    validWindowCount++;
                }
            }
            if (validWindowCount > 0) {
                finalAccuracies[currentWorkerId] = workerAccuracy / validWindowCount;
            }
            else {
                finalAccuracies[currentWorkerId] = 1 / M;
            }
        }
        this.logger.log(`M-X calculation completed. Results: ${JSON.stringify(finalAccuracies)}`);
        return finalAccuracies;
    }
    calculateMXAccuracyForWindow(windowWorkers, currentWorkerId, workerAnswersMap, answerIds, M) {
        const [w1, w2, w3] = windowWorkers;
        const currentWorkerIndex = windowWorkers.indexOf(currentWorkerId);
        if (currentWorkerIndex === -1)
            return null;
        const optionAccuracies = [];
        for (const answerId of answerIds) {
            const allAnswersForQuestion = windowWorkers
                .map((workerId) => this.getWorkerAnswerForQuestion(workerAnswersMap[workerId], answerId))
                .filter((answer) => answer !== null);
            if (allAnswersForQuestion.length < 3) {
                continue;
            }
            const uniqueChoices = Array.from(new Set(allAnswersForQuestion));
            for (const choice of uniqueChoices) {
                const binaryAnswersMap = {};
                for (const workerId of windowWorkers) {
                    const workerAnswer = this.getWorkerAnswerForQuestion(workerAnswersMap[workerId], answerId);
                    binaryAnswersMap[workerId] = [workerAnswer === choice ? 1 : 0];
                }
                const Q12 = this.calculateM1AgreementProbability(binaryAnswersMap[w1], binaryAnswersMap[w2]);
                const Q13 = this.calculateM1AgreementProbability(binaryAnswersMap[w1], binaryAnswersMap[w3]);
                const Q23 = this.calculateM1AgreementProbability(binaryAnswersMap[w2], binaryAnswersMap[w3]);
                let subQuestionAccuracy;
                if (currentWorkerIndex === 0) {
                    subQuestionAccuracy = this.calculateM1WorkerAccuracy(Q12, Q13);
                }
                else if (currentWorkerIndex === 1) {
                    subQuestionAccuracy = this.calculateM1WorkerAccuracy(Q12, Q23);
                }
                else {
                    subQuestionAccuracy = this.calculateM1WorkerAccuracy(Q13, Q23);
                }
                optionAccuracies.push(Math.max(subQuestionAccuracy, 0.01));
            }
        }
        if (optionAccuracies.length === 0) {
            return 1 / M;
        }
        const productAccuracy = optionAccuracies.reduce((product, accuracy) => product * accuracy, 1);
        return Math.max(1 / M, Math.min(0.95, productAccuracy));
    }
    getWorkerAnswerForQuestion(workerAnswers, answerId) {
        const answer = workerAnswers.find((wa) => wa.answerId === answerId);
        return answer ? answer.answer : null;
    }
    calculateM1AgreementProbability(worker1BinaryAnswers, worker2BinaryAnswers) {
        let agreementCount = 0;
        const effectiveN = Math.min(worker1BinaryAnswers.length, worker2BinaryAnswers.length);
        for (let i = 0; i < effectiveN; i++) {
            if (worker1BinaryAnswers[i] === worker2BinaryAnswers[i]) {
                agreementCount++;
            }
        }
        if (effectiveN === 0) {
            return 0.5;
        }
        const rawAgreement = agreementCount / effectiveN;
        const minAgreement = 0.35;
        const maxAgreement = 0.95;
        return Math.max(minAgreement, Math.min(maxAgreement, rawAgreement));
    }
    calculateM1WorkerAccuracy(Q12, Q13) {
        const avgAgreement = (Q12 + Q13) / 2;
        const accuracy = Math.max(0.25, Math.min(0.95, avgAgreement));
        return accuracy;
    }
};
exports.AccuracyCalculationServiceMX = AccuracyCalculationServiceMX;
exports.AccuracyCalculationServiceMX = AccuracyCalculationServiceMX = AccuracyCalculationServiceMX_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(recorded_1.RecordedAnswer.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_1.Users.name)),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object, typeof (_b = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _b : Object, typeof (_c = typeof create_eligibility_service_1.CreateEligibilityService !== "undefined" && create_eligibility_service_1.CreateEligibilityService) === "function" ? _c : Object, typeof (_d = typeof get_task_service_1.GetTaskService !== "undefined" && get_task_service_1.GetTaskService) === "function" ? _d : Object, typeof (_e = typeof utils_service_1.UtilsService !== "undefined" && utils_service_1.UtilsService) === "function" ? _e : Object])
], AccuracyCalculationServiceMX);


/***/ }),
/* 44 */
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
var CreateEligibilityService_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateEligibilityService = void 0;
const common_1 = __webpack_require__(3);
const mongoose_1 = __webpack_require__(4);
const eligibility_1 = __webpack_require__(39);
const mongoose_2 = __webpack_require__(13);
const parser_1 = __webpack_require__(40);
const schedule_1 = __webpack_require__(20);
const utils_service_1 = __webpack_require__(41);
let CreateEligibilityService = CreateEligibilityService_1 = class CreateEligibilityService {
    constructor(eligibilityModel, utilsService) {
        this.eligibilityModel = eligibilityModel;
        this.utilsService = utilsService;
        this.logger = new common_1.Logger(CreateEligibilityService_1.name);
    }
    async createEligibility(input) {
        const { taskId, workerId, accuracy } = input;
        const existingEligibility = await this.eligibilityModel.findOne({
            taskId,
            workerId,
        });
        if (existingEligibility) {
            this.logger.log('Eligibility remain unchanged for workerId: ' +
                workerId +
                ' and taskId: ' +
                taskId);
            return existingEligibility;
        }
        const newEligibility = await this.eligibilityModel.create({
            taskId,
            workerId,
            accuracy,
        });
        return newEligibility;
    }
    async getEligibilityByTaskId(taskId) {
        try {
            const eligibilityRecords = await this.eligibilityModel.find({ taskId });
            return eligibilityRecords.map((record) => (0, parser_1.parseToViewEligibility)(record));
        }
        catch (error) {
            console.error(`Error fetching eligibility records for task ${taskId}:`, error);
            return [];
        }
    }
    async performPeriodicRecalibration() {
        try {
            const shouldRecalibrate = await this.utilsService.shouldPerformGlobalRecalibration();
            if (shouldRecalibrate.needed) {
                this.logger.log(`Starting scheduled recalibration: ${shouldRecalibrate.reason}`);
                const result = await this.utilsService.performGlobalRecalibration();
                this.logger.log(`Scheduled recalibration completed: ${result.oldThreshold.toFixed(3)} -> ${result.newThreshold.toFixed(3)}, ${result.affectedWorkers} workers affected`);
            }
            else {
                this.logger.debug(`Recalibration not needed: ${shouldRecalibrate.reason}`);
            }
        }
        catch (error) {
            this.logger.error('Error during periodic recalibration', error);
        }
    }
};
exports.CreateEligibilityService = CreateEligibilityService;
__decorate([
    (0, schedule_1.Cron)('0 2 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], CreateEligibilityService.prototype, "performPeriodicRecalibration", null);
exports.CreateEligibilityService = CreateEligibilityService = CreateEligibilityService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(eligibility_1.Eligibility.name)),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object, typeof (_b = typeof utils_service_1.UtilsService !== "undefined" && utils_service_1.UtilsService) === "function" ? _b : Object])
], CreateEligibilityService);


/***/ }),
/* 45 */
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
const graphql_1 = __webpack_require__(5);
const user_1 = __webpack_require__(32);
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
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", Boolean)
], UserView.prototype, "isEligible", void 0);
__decorate([
    (0, graphql_1.Field)(() => [user_1.TaskCompletion], { nullable: true }),
    __metadata("design:type", Array)
], UserView.prototype, "completedTasks", void 0);
exports.UserView = UserView = __decorate([
    (0, graphql_1.ObjectType)()
], UserView);


/***/ }),
/* 46 */
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
const graphql_1 = __webpack_require__(5);
const user_enum_1 = __webpack_require__(30);
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
/* 47 */
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
const create_user_input_1 = __webpack_require__(46);
const graphql_1 = __webpack_require__(5);
let UpdateUserInput = class UpdateUserInput extends (0, graphql_1.PartialType)(create_user_input_1.CreateUserInput) {
};
exports.UpdateUserInput = UpdateUserInput;
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], UpdateUserInput.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], UpdateUserInput.prototype, "phoneNumber", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], UpdateUserInput.prototype, "address1", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], UpdateUserInput.prototype, "address2", void 0);
exports.UpdateUserInput = UpdateUserInput = __decorate([
    (0, graphql_1.InputType)()
], UpdateUserInput);


/***/ }),
/* 48 */
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
const graphql_1 = __webpack_require__(5);
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
/* 49 */
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
const common_1 = __webpack_require__(3);
const mongoose_1 = __webpack_require__(4);
const mongoose_2 = __webpack_require__(13);
const user_1 = __webpack_require__(32);
const gqlerr_1 = __webpack_require__(15);
const parser_1 = __webpack_require__(35);
const user_enum_1 = __webpack_require__(30);
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
    async getAllWorkers() {
        try {
            const workers = await this.usersModel.find({ role: user_enum_1.Role.WORKER });
            return workers.map(parser_1.parseToView);
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL(error, gqlerr_1.GQLThrowType.UNPROCESSABLE);
        }
    }
    async getTotalUsers() {
        try {
            return this.usersModel.countDocuments({ role: user_enum_1.Role.WORKER });
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
/* 50 */
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
const common_1 = __webpack_require__(3);
const core_1 = __webpack_require__(1);
const graphql_1 = __webpack_require__(5);
const jwt = __webpack_require__(51);
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
        const authHeader = req.headers?.authorization;
        if (!authHeader) {
            throw new common_1.UnauthorizedException('Missing authorization header');
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new common_1.UnauthorizedException('Invalid authorization format');
        }
        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            req.user = decoded;
            if (!requiredRoles || requiredRoles.length === 0) {
                return true;
            }
            if (!req.user || !req.user.role) {
                throw new common_1.UnauthorizedException('User role not found');
            }
            if (!requiredRoles.includes(req.user.role)) {
                throw new common_1.ForbiddenException('Insufficient permissions');
            }
            return true;
        }
        catch (error) {
            console.error('JWT Verification Error:', error.message);
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof core_1.Reflector !== "undefined" && core_1.Reflector) === "function" ? _a : Object])
], RolesGuard);


/***/ }),
/* 51 */
/***/ ((module) => {

module.exports = require("jsonwebtoken");

/***/ }),
/* 52 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JwtAuthGuard = void 0;
const dotenv = __webpack_require__(9);
dotenv.config();
const common_1 = __webpack_require__(3);
const graphql_1 = __webpack_require__(5);
const jwt = __webpack_require__(51);
const gqlerr_1 = __webpack_require__(15);
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
            throw new gqlerr_1.ThrowGQL(`${req.user} Unauthorized`, gqlerr_1.GQLThrowType.NOT_AUTHORIZED);
        }
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)()
], JwtAuthGuard);


/***/ }),
/* 53 */
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
exports.CreateRecordedAnswerInput = void 0;
const graphql_1 = __webpack_require__(5);
let CreateRecordedAnswerInput = class CreateRecordedAnswerInput {
};
exports.CreateRecordedAnswerInput = CreateRecordedAnswerInput;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], CreateRecordedAnswerInput.prototype, "taskId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], CreateRecordedAnswerInput.prototype, "answer", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], CreateRecordedAnswerInput.prototype, "answerId", void 0);
exports.CreateRecordedAnswerInput = CreateRecordedAnswerInput = __decorate([
    (0, graphql_1.InputType)()
], CreateRecordedAnswerInput);


/***/ }),
/* 54 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.M1Module = void 0;
const tasks_module_1 = __webpack_require__(10);
const common_1 = __webpack_require__(3);
const mongoose_1 = __webpack_require__(4);
const mx_resolver_1 = __webpack_require__(55);
const task_1 = __webpack_require__(14);
const recorded_1 = __webpack_require__(22);
const eligibility_1 = __webpack_require__(39);
const get_recorded_service_1 = __webpack_require__(21);
const create_eligibility_service_1 = __webpack_require__(44);
const create_recorded_service_1 = __webpack_require__(56);
const get_eligibility_service_1 = __webpack_require__(38);
const users_module_1 = __webpack_require__(31);
const user_1 = __webpack_require__(32);
const create_recorded_input_1 = __webpack_require__(53);
const mx_calculation_service_1 = __webpack_require__(43);
const worker_analysis_service_1 = __webpack_require__(59);
const dashboard_service_1 = __webpack_require__(61);
const data_analysis_service_1 = __webpack_require__(64);
const utils_service_1 = __webpack_require__(41);
const utils_1 = __webpack_require__(42);
let M1Module = class M1Module {
};
exports.M1Module = M1Module;
exports.M1Module = M1Module = __decorate([
    (0, common_1.Module)({
        imports: [
            (0, common_1.forwardRef)(() => tasks_module_1.TasksModule),
            (0, common_1.forwardRef)(() => users_module_1.UsersModule),
            mongoose_1.MongooseModule.forFeature([
                { name: task_1.Task.name, schema: task_1.TaskSchema },
                { name: recorded_1.RecordedAnswer.name, schema: recorded_1.RecordedAnswerSchema },
                { name: eligibility_1.Eligibility.name, schema: eligibility_1.EligibilitySchema },
                { name: user_1.Users.name, schema: user_1.UsersSchema },
                { name: utils_1.Utils.name, schema: utils_1.UtilsSchema },
            ]),
        ],
        providers: [
            create_recorded_input_1.CreateRecordedAnswerInput,
            data_analysis_service_1.MissingWorkerIdCronService,
            create_recorded_service_1.CreateRecordedService,
            create_eligibility_service_1.CreateEligibilityService,
            get_eligibility_service_1.GetEligibilityService,
            get_recorded_service_1.GetRecordedAnswerService,
            mx_calculation_service_1.AccuracyCalculationServiceMX,
            worker_analysis_service_1.WorkerAnalysisService,
            utils_service_1.UtilsService,
            dashboard_service_1.DashboardService,
            mx_resolver_1.M1Resolver,
        ],
        exports: [
            create_recorded_input_1.CreateRecordedAnswerInput,
            create_recorded_service_1.CreateRecordedService,
            create_eligibility_service_1.CreateEligibilityService,
            get_eligibility_service_1.GetEligibilityService,
            get_recorded_service_1.GetRecordedAnswerService,
            dashboard_service_1.DashboardService,
            utils_service_1.UtilsService,
            mx_calculation_service_1.AccuracyCalculationServiceMX,
            worker_analysis_service_1.WorkerAnalysisService,
        ],
    })
], M1Module);


/***/ }),
/* 55 */
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.M1Resolver = void 0;
const graphql_1 = __webpack_require__(5);
const role_decorator_1 = __webpack_require__(29);
const user_enum_1 = __webpack_require__(30);
const create_recorded_service_1 = __webpack_require__(56);
const get_eligibility_service_1 = __webpack_require__(38);
const eligibility_view_1 = __webpack_require__(57);
const common_1 = __webpack_require__(3);
const role_guard_1 = __webpack_require__(50);
const jwt_guard_1 = __webpack_require__(52);
const update_user_service_1 = __webpack_require__(37);
const create_recorded_input_1 = __webpack_require__(53);
const worker_analysis_view_1 = __webpack_require__(58);
const worker_analysis_service_1 = __webpack_require__(59);
const dashboard_view_1 = __webpack_require__(60);
const dashboard_service_1 = __webpack_require__(61);
const utils_1 = __webpack_require__(42);
const utils_service_1 = __webpack_require__(41);
const create_utils_input_1 = __webpack_require__(62);
const mx_calculation_service_1 = __webpack_require__(43);
let M1Resolver = class M1Resolver {
    constructor(getEligibilityService, createRecordedService, updateUserService, workerAnalysisService, dashboardService, utilsService, accuracyCalculationService) {
        this.getEligibilityService = getEligibilityService;
        this.createRecordedService = createRecordedService;
        this.updateUserService = updateUserService;
        this.workerAnalysisService = workerAnalysisService;
        this.dashboardService = dashboardService;
        this.utilsService = utilsService;
        this.accuracyCalculationService = accuracyCalculationService;
    }
    async submitAnswer(input, context) {
        const workerId = context.req.user.id;
        await this.createRecordedService.recordAnswer(input, workerId);
        await this.updateUserService.userHasDoneTask(input, workerId);
        return true;
    }
    async getEligibilityHistory(workerId) {
        return this.getEligibilityService.getEligibilityWorkerId(workerId);
    }
    async getAlgorithmPerformance() {
        return this.workerAnalysisService.getAlgorithmPerformance();
    }
    async getTesterAnalysis() {
        return this.workerAnalysisService.getTesterAnalysis();
    }
    async getTestResults() {
        return this.workerAnalysisService.getTestResults();
    }
    async getDashboardSummary() {
        return this.dashboardService.getDashboardSummary();
    }
    async getThresholdSettings() {
        return this.utilsService.getThresholdSettings();
    }
    async updateThresholdSettings(input) {
        return this.utilsService.updateThresholdSettings(input.thresholdType, input.thresholdValue);
    }
    async triggerEligibilityUpdate() {
        try {
            await this.workerAnalysisService.updateAllWorkerEligibility();
            return true;
        }
        catch (error) {
            return false;
        }
    }
};
exports.M1Resolver = M1Resolver;
__decorate([
    (0, graphql_1.Mutation)(() => Boolean),
    (0, role_decorator_1.Roles)(user_enum_1.Role.WORKER),
    __param(0, (0, graphql_1.Args)('input')),
    __param(1, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof create_recorded_input_1.CreateRecordedAnswerInput !== "undefined" && create_recorded_input_1.CreateRecordedAnswerInput) === "function" ? _h : Object, Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], M1Resolver.prototype, "submitAnswer", null);
__decorate([
    (0, graphql_1.Query)(() => [eligibility_view_1.EligibilityView]),
    (0, role_decorator_1.Roles)(user_enum_1.Role.WORKER, user_enum_1.Role.ADMIN),
    __param(0, (0, graphql_1.Args)('workerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", typeof (_k = typeof Promise !== "undefined" && Promise) === "function" ? _k : Object)
], M1Resolver.prototype, "getEligibilityHistory", null);
__decorate([
    (0, graphql_1.Query)(() => [worker_analysis_view_1.AlgorithmPerformanceData]),
    (0, role_decorator_1.Roles)(user_enum_1.Role.ADMIN, user_enum_1.Role.QUESTION_VALIDATOR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], M1Resolver.prototype, "getAlgorithmPerformance", null);
__decorate([
    (0, graphql_1.Query)(() => [worker_analysis_view_1.TesterAnalysisView]),
    (0, role_decorator_1.Roles)(user_enum_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_m = typeof Promise !== "undefined" && Promise) === "function" ? _m : Object)
], M1Resolver.prototype, "getTesterAnalysis", null);
__decorate([
    (0, graphql_1.Query)(() => [worker_analysis_view_1.TestResultView]),
    (0, role_decorator_1.Roles)(user_enum_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], M1Resolver.prototype, "getTestResults", null);
__decorate([
    (0, graphql_1.Query)(() => dashboard_view_1.DashboardSummary),
    (0, role_decorator_1.Roles)(user_enum_1.Role.ADMIN, user_enum_1.Role.WORKER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_p = typeof Promise !== "undefined" && Promise) === "function" ? _p : Object)
], M1Resolver.prototype, "getDashboardSummary", null);
__decorate([
    (0, graphql_1.Query)(() => utils_1.Utils),
    (0, role_decorator_1.Roles)(user_enum_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], M1Resolver.prototype, "getThresholdSettings", null);
__decorate([
    (0, graphql_1.Mutation)(() => utils_1.Utils),
    (0, role_decorator_1.Roles)(user_enum_1.Role.ADMIN),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_r = typeof create_utils_input_1.ThresholdSettingsInput !== "undefined" && create_utils_input_1.ThresholdSettingsInput) === "function" ? _r : Object]),
    __metadata("design:returntype", typeof (_s = typeof Promise !== "undefined" && Promise) === "function" ? _s : Object)
], M1Resolver.prototype, "updateThresholdSettings", null);
__decorate([
    (0, graphql_1.Mutation)(() => Boolean),
    (0, role_decorator_1.Roles)(user_enum_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_t = typeof Promise !== "undefined" && Promise) === "function" ? _t : Object)
], M1Resolver.prototype, "triggerEligibilityUpdate", null);
exports.M1Resolver = M1Resolver = __decorate([
    (0, graphql_1.Resolver)(),
    (0, common_1.UseGuards)(role_guard_1.RolesGuard, jwt_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof get_eligibility_service_1.GetEligibilityService !== "undefined" && get_eligibility_service_1.GetEligibilityService) === "function" ? _a : Object, typeof (_b = typeof create_recorded_service_1.CreateRecordedService !== "undefined" && create_recorded_service_1.CreateRecordedService) === "function" ? _b : Object, typeof (_c = typeof update_user_service_1.UpdateUserService !== "undefined" && update_user_service_1.UpdateUserService) === "function" ? _c : Object, typeof (_d = typeof worker_analysis_service_1.WorkerAnalysisService !== "undefined" && worker_analysis_service_1.WorkerAnalysisService) === "function" ? _d : Object, typeof (_e = typeof dashboard_service_1.DashboardService !== "undefined" && dashboard_service_1.DashboardService) === "function" ? _e : Object, typeof (_f = typeof utils_service_1.UtilsService !== "undefined" && utils_service_1.UtilsService) === "function" ? _f : Object, typeof (_g = typeof mx_calculation_service_1.AccuracyCalculationServiceMX !== "undefined" && mx_calculation_service_1.AccuracyCalculationServiceMX) === "function" ? _g : Object])
], M1Resolver);


/***/ }),
/* 56 */
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
var CreateRecordedService_1;
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateRecordedService = void 0;
const gqlerr_1 = __webpack_require__(15);
const common_1 = __webpack_require__(3);
const mongoose_1 = __webpack_require__(4);
const mongoose_2 = __webpack_require__(13);
const recorded_1 = __webpack_require__(22);
const get_task_service_1 = __webpack_require__(19);
const mx_calculation_service_1 = __webpack_require__(43);
const user_1 = __webpack_require__(32);
let CreateRecordedService = CreateRecordedService_1 = class CreateRecordedService {
    constructor(recordedAnswerModel, userModel, getTaskService, accuracyCalculationService) {
        this.recordedAnswerModel = recordedAnswerModel;
        this.userModel = userModel;
        this.getTaskService = getTaskService;
        this.accuracyCalculationService = accuracyCalculationService;
        this.logger = new common_1.Logger(CreateRecordedService_1.name);
    }
    async createRecordedAnswer(taskId, workerId, answerId) {
        try {
            const task = await this.getTaskService.getTaskById(taskId);
            const answerText = task?.answers.find((a) => a.answerId === answerId)?.answer || '';
            const recordedAnswer = await this.recordedAnswerModel.create({
                taskId,
                workerId,
                answerId,
                answer: answerText,
            });
            this.logger.log(`Answer recorded for worker ${workerId} on task ${taskId}`);
            return recordedAnswer;
        }
        catch (error) {
            throw new gqlerr_1.ThrowGQL('Error in creating recorded answer', error);
        }
    }
    async recordAnswer(input, workerId) {
        const answerId = input.answerId;
        const taskId = input.taskId;
        await this.createRecordedAnswer(taskId, workerId, answerId);
        this.logger.log(`Answer recorded for worker ${workerId} on task ${taskId} with answerId ${answerId}`);
        try {
            await this.accuracyCalculationService.processWorkerSubmission(taskId, workerId);
            this.logger.log(`M-X processing triggered for worker ${workerId} on task ${taskId}`);
        }
        catch (error) {
            this.logger.error(`Error triggering M-X processing for worker ${workerId} on task ${taskId}: ${error.message}`);
        }
    }
};
exports.CreateRecordedService = CreateRecordedService;
exports.CreateRecordedService = CreateRecordedService = CreateRecordedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(recorded_1.RecordedAnswer.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_1.Users.name)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => get_task_service_1.GetTaskService))),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => mx_calculation_service_1.AccuracyCalculationServiceMX))),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object, typeof (_b = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _b : Object, typeof (_c = typeof get_task_service_1.GetTaskService !== "undefined" && get_task_service_1.GetTaskService) === "function" ? _c : Object, typeof (_d = typeof mx_calculation_service_1.AccuracyCalculationServiceMX !== "undefined" && mx_calculation_service_1.AccuracyCalculationServiceMX) === "function" ? _d : Object])
], CreateRecordedService);


/***/ }),
/* 57 */
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
exports.EligibilityView = void 0;
const graphql_1 = __webpack_require__(5);
let EligibilityView = class EligibilityView {
};
exports.EligibilityView = EligibilityView;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], EligibilityView.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], EligibilityView.prototype, "taskId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], EligibilityView.prototype, "workerId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], EligibilityView.prototype, "accuracy", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], EligibilityView.prototype, "feedback", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], EligibilityView.prototype, "Date", void 0);
exports.EligibilityView = EligibilityView = __decorate([
    (0, graphql_1.ObjectType)()
], EligibilityView);


/***/ }),
/* 58 */
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
exports.TestResultView = exports.TesterAnalysisView = exports.AlgorithmPerformanceData = void 0;
const graphql_1 = __webpack_require__(5);
let AlgorithmPerformanceData = class AlgorithmPerformanceData {
};
exports.AlgorithmPerformanceData = AlgorithmPerformanceData;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AlgorithmPerformanceData.prototype, "month", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], AlgorithmPerformanceData.prototype, "accuracyRate", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], AlgorithmPerformanceData.prototype, "responseTime", void 0);
exports.AlgorithmPerformanceData = AlgorithmPerformanceData = __decorate([
    (0, graphql_1.ObjectType)()
], AlgorithmPerformanceData);
let TesterAnalysisView = class TesterAnalysisView {
};
exports.TesterAnalysisView = TesterAnalysisView;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], TesterAnalysisView.prototype, "workerId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], TesterAnalysisView.prototype, "testerName", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], TesterAnalysisView.prototype, "averageScore", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], TesterAnalysisView.prototype, "accuracy", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", Boolean)
], TesterAnalysisView.prototype, "isEligible", void 0);
exports.TesterAnalysisView = TesterAnalysisView = __decorate([
    (0, graphql_1.ObjectType)()
], TesterAnalysisView);
let TestResultView = class TestResultView {
};
exports.TestResultView = TestResultView;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], TestResultView.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], TestResultView.prototype, "workerId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], TestResultView.prototype, "testId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], TestResultView.prototype, "score", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], TestResultView.prototype, "eligibilityStatus", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], TestResultView.prototype, "feedback", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], TestResultView.prototype, "createdAt", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], TestResultView.prototype, "formattedDate", void 0);
exports.TestResultView = TestResultView = __decorate([
    (0, graphql_1.ObjectType)()
], TestResultView);


/***/ }),
/* 59 */
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
var WorkerAnalysisService_1;
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WorkerAnalysisService = void 0;
const gqlerr_1 = __webpack_require__(15);
const common_1 = __webpack_require__(3);
const schedule_1 = __webpack_require__(20);
const mongoose_1 = __webpack_require__(4);
const mongoose_2 = __webpack_require__(13);
const eligibility_1 = __webpack_require__(39);
const recorded_1 = __webpack_require__(22);
const get_user_service_1 = __webpack_require__(49);
const user_1 = __webpack_require__(32);
const utils_service_1 = __webpack_require__(41);
const get_task_service_1 = __webpack_require__(19);
let WorkerAnalysisService = WorkerAnalysisService_1 = class WorkerAnalysisService {
    constructor(eligibilityModel, recordedAnswerModel, userModel, getUserService, utilsService, getTaskService) {
        this.eligibilityModel = eligibilityModel;
        this.recordedAnswerModel = recordedAnswerModel;
        this.userModel = userModel;
        this.getUserService = getUserService;
        this.utilsService = utilsService;
        this.getTaskService = getTaskService;
        this.logger = new common_1.Logger(WorkerAnalysisService_1.name);
        this.performanceHistory = [];
        this.testResultsCache = null;
        this.testerAnalysisCache = null;
        this.CACHE_TTL = 1 * 60 * 1000;
        this.updatePerformanceMetrics();
    }
    async getAlgorithmPerformance() {
        try {
            if (this.performanceHistory.length === 0) {
                await this.updatePerformanceMetrics();
            }
            return this.performanceHistory;
        }
        catch (error) {
            this.logger.error('Error getting algorithm performance data', error);
            throw new gqlerr_1.ThrowGQL('Failed to retrieve algorithm performance data', gqlerr_1.GQLThrowType.UNEXPECTED);
        }
    }
    async getTesterAnalysis() {
        try {
            const startTime = Date.now();
            this.logger.log('Starting getTesterAnalysis');
            const thresholdSettings = await this.utilsService.getThresholdSettings();
            const thresholdValue = thresholdSettings.thresholdValue;
            const totalTasks = await this.getTaskService.getTotalTasks();
            this.logger.log(`Current threshold value: ${thresholdValue}, Total tasks: ${totalTasks}`);
            const workerAnalysis = await this.userModel.aggregate([
                { $match: { role: 'worker' } },
                {
                    $addFields: {
                        completedTasksCount: {
                            $size: { $ifNull: ['$completedTasks', []] },
                        },
                        hasCompletedAllTasks: {
                            $gte: [
                                { $size: { $ifNull: ['$completedTasks', []] } },
                                totalTasks,
                            ],
                        },
                    },
                },
                {
                    $lookup: {
                        from: 'eligibilities',
                        localField: '_id',
                        foreignField: 'workerId',
                        as: 'eligibilityRecords',
                    },
                },
                {
                    $addFields: {
                        averageAccuracy: {
                            $cond: {
                                if: { $gt: [{ $size: '$eligibilityRecords' }, 0] },
                                then: { $avg: '$eligibilityRecords.accuracy' },
                                else: 0,
                            },
                        },
                        eligibilityRecordsCount: { $size: '$eligibilityRecords' },
                    },
                },
                {
                    $addFields: {
                        calculatedEligibility: {
                            $cond: {
                                if: {
                                    $and: [
                                        { $eq: ['$hasCompletedAllTasks', true] },
                                        { $gt: ['$eligibilityRecordsCount', 0] },
                                        { $gt: ['$averageAccuracy', thresholdValue] },
                                    ],
                                },
                                then: true,
                                else: {
                                    $cond: {
                                        if: {
                                            $and: [
                                                { $eq: ['$hasCompletedAllTasks', true] },
                                                { $gt: ['$eligibilityRecordsCount', 0] },
                                            ],
                                        },
                                        then: false,
                                        else: null,
                                    },
                                },
                            },
                        },
                        status: {
                            $cond: {
                                if: { $eq: ['$hasCompletedAllTasks', true] },
                                then: {
                                    $cond: {
                                        if: { $gt: ['$eligibilityRecordsCount', 0] },
                                        then: 'completed_with_eligibility',
                                        else: 'completed_pending_eligibility',
                                    },
                                },
                                else: 'in_progress',
                            },
                        },
                    },
                },
                {
                    $project: {
                        workerId: { $toString: '$_id' },
                        testerName: {
                            $concat: [
                                { $ifNull: ['$firstName', 'Unknown'] },
                                ' ',
                                { $ifNull: ['$lastName', 'User'] },
                            ],
                        },
                        averageScore: { $round: ['$averageAccuracy', 3] },
                        accuracy: { $round: ['$averageAccuracy', 3] },
                        isEligible: '$calculatedEligibility',
                        completedTasksCount: 1,
                        totalTasks: { $literal: totalTasks },
                        hasCompletedAllTasks: 1,
                        eligibilityRecordsCount: 1,
                        status: 1,
                    },
                },
                {
                    $sort: { accuracy: -1, completedTasksCount: -1 },
                },
            ]);
            this.logger.log(`getTesterAnalysis executed in ${Date.now() - startTime}ms. Found ${workerAnalysis.length} workers.`);
            const statusSummary = workerAnalysis.reduce((acc, worker) => {
                acc[worker.status] = (acc[worker.status] || 0) + 1;
                return acc;
            }, {});
            this.logger.log(`Worker status summary:`, statusSummary);
            this.testerAnalysisCache = {
                results: workerAnalysis,
                timestamp: Date.now(),
            };
            return workerAnalysis;
        }
        catch (error) {
            this.logger.error(`Error getting tester analysis data: ${error.message}`);
            throw new gqlerr_1.ThrowGQL('Failed to retrieve tester analysis data', gqlerr_1.GQLThrowType.UNEXPECTED);
        }
    }
    async getTestResults(page = 1, limit = 288) {
        try {
            const startTime = Date.now();
            this.logger.log('Starting getTestResults');
            const thresholdSettings = await this.utilsService.getThresholdSettings();
            const threshold = thresholdSettings.thresholdValue;
            const skip = (page - 1) * limit;
            const results = await this.eligibilityModel.aggregate([
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: limit },
                {
                    $addFields: {
                        eligibilityStatus: {
                            $cond: {
                                if: { $gt: [{ $ifNull: ['$accuracy', 0] }, threshold] },
                                then: 'Eligible',
                                else: 'Not Eligible',
                            },
                        },
                        formattedDate: {
                            $dateToString: {
                                format: '%Y-%m-%d %H:%M',
                                date: { $ifNull: ['$createdAt', new Date()] },
                            },
                        },
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        let: { workerObjectId: { $toObjectId: '$workerId' } },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$_id', '$$workerObjectId'] } } },
                        ],
                        as: 'workerDetails',
                    },
                },
                {
                    $unwind: {
                        path: '$workerDetails',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $project: {
                        id: { $toString: '$_id' },
                        workerId: { $toString: '$workerId' },
                        testId: { $toString: '$taskId' },
                        score: { $round: [{ $ifNull: ['$accuracy', 0.5] }, 3] },
                        eligibilityStatus: 1,
                        feedback: {
                            $concat: [
                                'M-X Algorithm Analysis - Worker: ',
                                { $ifNull: ['$workerDetails.firstName', 'Unknown'] },
                                ' ',
                                { $ifNull: ['$workerDetails.lastName', 'User'] },
                                ' | Task: ',
                                { $toString: '$taskId' },
                                ' | Accuracy: ',
                                { $toString: { $round: [{ $ifNull: ['$accuracy', 0] }, 3] } },
                            ],
                        },
                        createdAt: '$createdAt',
                        formattedDate: 1,
                    },
                },
            ]);
            this.logger.log(`getTestResults executed in ${Date.now() - startTime}ms. Found ${results.length} results.`);
            this.testResultsCache = {
                results,
                timestamp: Date.now(),
            };
            return results;
        }
        catch (error) {
            this.logger.error(`Error getting test results data: ${error.message}`);
            throw new gqlerr_1.ThrowGQL('Failed to retrieve test results data', gqlerr_1.GQLThrowType.UNEXPECTED);
        }
    }
    async updateWorkerEligibility(workerId, threshold) {
        try {
            const result = await this.eligibilityModel.aggregate([
                { $match: { workerId: workerId } },
                {
                    $group: {
                        _id: null,
                        averageAccuracy: { $avg: { $ifNull: ['$accuracy', 0] } },
                        count: { $sum: 1 },
                    },
                },
            ]);
            if (!result.length || result[0].count === 0) {
                this.logger.debug(`No eligibility records found for worker ${workerId}`);
                return;
            }
            const averageAccuracy = result[0].averageAccuracy;
            if (threshold === undefined) {
                const thresholdSettings = await this.utilsService.getThresholdSettings();
                threshold = thresholdSettings.thresholdValue;
            }
            const isEligible = averageAccuracy > threshold;
            await this.userModel.findByIdAndUpdate(workerId, { $set: { isEligible } }, { new: true });
            this.logger.log(`Updated eligibility for worker ${workerId}: ${isEligible ? 'Eligible' : 'Not Eligible'} (avg accuracy: ${averageAccuracy.toFixed(3)}, threshold: ${threshold.toFixed(3)})`);
            this.testResultsCache = null;
            this.testerAnalysisCache = null;
        }
        catch (error) {
            this.logger.error(`Error updating eligibility for worker ${workerId}: ${error.message}`);
        }
    }
    async updateAllWorkerEligibility() {
        try {
            const startTime = Date.now();
            this.logger.log('Starting updateAllWorkerEligibility');
            const thresholdSettings = await this.utilsService.getThresholdSettings();
            const threshold = thresholdSettings.thresholdValue;
            const totalTasks = await this.getTaskService.getTotalTasks();
            this.logger.log(`Running eligibility update with threshold: ${threshold}, total tasks: ${totalTasks}`);
            const workerEligibilities = await this.eligibilityModel.aggregate([
                {
                    $group: {
                        _id: '$workerId',
                        averageAccuracy: { $avg: { $ifNull: ['$accuracy', 0] } },
                        totalRecords: { $sum: 1 },
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        let: { workerObjectId: { $toObjectId: '$_id' } },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$_id', '$$workerObjectId'] } } },
                        ],
                        as: 'workerDetails',
                    },
                },
                {
                    $unwind: { path: '$workerDetails', preserveNullAndEmptyArrays: true },
                },
                {
                    $addFields: {
                        completedTasksCount: {
                            $size: { $ifNull: ['$workerDetails.completedTasks', []] },
                        },
                        hasCompletedAllTasks: {
                            $gte: [
                                { $size: { $ifNull: ['$workerDetails.completedTasks', []] } },
                                totalTasks,
                            ],
                        },
                    },
                },
                {
                    $match: { hasCompletedAllTasks: true },
                },
                {
                    $addFields: {
                        isEligible: { $gt: ['$averageAccuracy', threshold] },
                    },
                },
            ]);
            const bulkOps = workerEligibilities.map((worker) => ({
                updateOne: {
                    filter: { _id: worker._id },
                    update: { $set: { isEligible: worker.isEligible } },
                },
            }));
            const workersCompletedNoPending = await this.userModel.aggregate([
                { $match: { role: 'worker' } },
                {
                    $addFields: {
                        completedTasksCount: {
                            $size: { $ifNull: ['$completedTasks', []] },
                        },
                        hasCompletedAllTasks: {
                            $gte: [
                                { $size: { $ifNull: ['$completedTasks', []] } },
                                totalTasks,
                            ],
                        },
                    },
                },
                {
                    $match: { hasCompletedAllTasks: true },
                },
                {
                    $lookup: {
                        from: 'eligibilities',
                        localField: '_id',
                        foreignField: 'workerId',
                        as: 'eligibilities',
                    },
                },
                { $match: { eligibilities: { $size: 0 } } },
            ]);
            workersCompletedNoPending.forEach((worker) => {
                bulkOps.push({
                    updateOne: {
                        filter: { _id: worker._id },
                        update: { $set: { isEligible: null } },
                    },
                });
            });
            const workersNotCompleted = await this.userModel.aggregate([
                { $match: { role: 'worker' } },
                {
                    $addFields: {
                        completedTasksCount: {
                            $size: { $ifNull: ['$completedTasks', []] },
                        },
                        hasCompletedAllTasks: {
                            $gte: [
                                { $size: { $ifNull: ['$completedTasks', []] } },
                                totalTasks,
                            ],
                        },
                    },
                },
                {
                    $match: { hasCompletedAllTasks: false },
                },
            ]);
            workersNotCompleted.forEach((worker) => {
                bulkOps.push({
                    updateOne: {
                        filter: { _id: worker._id },
                        update: { $set: { isEligible: null } },
                    },
                });
            });
            if (bulkOps.length > 0) {
                const result = await this.userModel.bulkWrite(bulkOps);
                this.logger.log(`Bulk updated ${result.modifiedCount} worker eligibility statuses in ${Date.now() - startTime}ms`);
            }
            else {
                this.logger.log('No worker eligibility updates required');
            }
            this.testResultsCache = null;
            this.testerAnalysisCache = null;
            this.logger.log('All worker eligibility statuses updated successfully');
            return true;
        }
        catch (error) {
            this.logger.error(`Error updating all worker eligibility statuses: ${error.message}`);
            return false;
        }
    }
    async updatePerformanceMetrics() {
        try {
            const now = new Date();
            const monthNames = [
                'Jan',
                'Feb',
                'Mar',
                'Apr',
                'May',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Oct',
                'Nov',
                'Dec',
            ];
            this.performanceHistory = [];
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            const accuracyByMonth = await this.eligibilityModel.aggregate([
                { $match: { createdAt: { $gte: sixMonthsAgo } } },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                        },
                        avgAccuracy: { $avg: { $ifNull: ['$accuracy', 0.5] } },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
            ]);
            const responseTimeByMonth = await this.recordedAnswerModel.aggregate([
                { $match: { createdAt: { $gte: sixMonthsAgo } } },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                        },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
            ]);
            const accuracyMap = new Map();
            accuracyByMonth.forEach((item) => {
                const key = `${item._id.year}-${item._id.month}`;
                accuracyMap.set(key, item.avgAccuracy);
            });
            const responseMap = new Map();
            responseTimeByMonth.forEach((item) => {
                const key = `${item._id.year}-${item._id.month}`;
                responseMap.set(key, item.count);
            });
            for (let i = 5; i >= 0; i--) {
                const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const year = monthDate.getFullYear();
                const month = monthDate.getMonth() + 1;
                const key = `${year}-${month}`;
                const accuracy = accuracyMap.has(key) ? accuracyMap.get(key) : 0.75;
                const recordedCount = responseMap.has(key) ? responseMap.get(key) : 0;
                const responseTime = recordedCount > 0
                    ? 250 - Math.min(recordedCount, 30)
                    : 270 - (5 - i) * 10;
                this.performanceHistory.push({
                    month: `${monthNames[monthDate.getMonth()]} ${year}`,
                    accuracyRate: parseFloat(accuracy.toFixed(2)),
                    responseTime: Math.round(Math.max(220, responseTime)),
                });
            }
            this.logger.log('Performance metrics updated successfully');
        }
        catch (error) {
            this.logger.error(`Error updating performance metrics: ${error.message}`);
        }
    }
};
exports.WorkerAnalysisService = WorkerAnalysisService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WorkerAnalysisService.prototype, "updatePerformanceMetrics", null);
exports.WorkerAnalysisService = WorkerAnalysisService = WorkerAnalysisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(eligibility_1.Eligibility.name)),
    __param(1, (0, mongoose_1.InjectModel)(recorded_1.RecordedAnswer.name)),
    __param(2, (0, mongoose_1.InjectModel)(user_1.Users.name)),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object, typeof (_b = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _b : Object, typeof (_c = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _c : Object, typeof (_d = typeof get_user_service_1.GetUserService !== "undefined" && get_user_service_1.GetUserService) === "function" ? _d : Object, typeof (_e = typeof utils_service_1.UtilsService !== "undefined" && utils_service_1.UtilsService) === "function" ? _e : Object, typeof (_f = typeof get_task_service_1.GetTaskService !== "undefined" && get_task_service_1.GetTaskService) === "function" ? _f : Object])
], WorkerAnalysisService);


/***/ }),
/* 60 */
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
exports.DashboardSummary = exports.AccuracyDistribution = exports.StatusDistribution = exports.IterationMetric = void 0;
const graphql_1 = __webpack_require__(5);
let IterationMetric = class IterationMetric {
};
exports.IterationMetric = IterationMetric;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], IterationMetric.prototype, "iteration", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], IterationMetric.prototype, "workers", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], IterationMetric.prototype, "tasks", void 0);
exports.IterationMetric = IterationMetric = __decorate([
    (0, graphql_1.ObjectType)()
], IterationMetric);
let StatusDistribution = class StatusDistribution {
};
exports.StatusDistribution = StatusDistribution;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], StatusDistribution.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], StatusDistribution.prototype, "value", void 0);
exports.StatusDistribution = StatusDistribution = __decorate([
    (0, graphql_1.ObjectType)()
], StatusDistribution);
let AccuracyDistribution = class AccuracyDistribution {
};
exports.AccuracyDistribution = AccuracyDistribution;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AccuracyDistribution.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], AccuracyDistribution.prototype, "value", void 0);
exports.AccuracyDistribution = AccuracyDistribution = __decorate([
    (0, graphql_1.ObjectType)()
], AccuracyDistribution);
let DashboardSummary = class DashboardSummary {
};
exports.DashboardSummary = DashboardSummary;
__decorate([
    (0, graphql_1.Field)(() => [IterationMetric]),
    __metadata("design:type", Array)
], DashboardSummary.prototype, "iterationMetrics", void 0);
__decorate([
    (0, graphql_1.Field)(() => [StatusDistribution]),
    __metadata("design:type", Array)
], DashboardSummary.prototype, "workerEligibility", void 0);
__decorate([
    (0, graphql_1.Field)(() => [StatusDistribution]),
    __metadata("design:type", Array)
], DashboardSummary.prototype, "taskValidation", void 0);
__decorate([
    (0, graphql_1.Field)(() => [AccuracyDistribution]),
    __metadata("design:type", Array)
], DashboardSummary.prototype, "accuracyDistribution", void 0);
exports.DashboardSummary = DashboardSummary = __decorate([
    (0, graphql_1.ObjectType)()
], DashboardSummary);


/***/ }),
/* 61 */
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
var DashboardService_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DashboardService = void 0;
const common_1 = __webpack_require__(3);
const mongoose_1 = __webpack_require__(4);
const mongoose_2 = __webpack_require__(13);
const task_1 = __webpack_require__(14);
const user_1 = __webpack_require__(32);
const eligibility_1 = __webpack_require__(39);
const user_enum_1 = __webpack_require__(30);
let DashboardService = DashboardService_1 = class DashboardService {
    constructor(taskModel, userModel, eligibilityModel) {
        this.taskModel = taskModel;
        this.userModel = userModel;
        this.eligibilityModel = eligibilityModel;
        this.logger = new common_1.Logger(DashboardService_1.name);
    }
    async getDashboardSummary() {
        try {
            const workerEligibility = await this.getWorkerEligibilityDistribution();
            const taskValidation = await this.getTaskValidationDistribution();
            const accuracyDistribution = await this.getAccuracyDistribution();
            return {
                iterationMetrics: [],
                workerEligibility,
                taskValidation,
                accuracyDistribution,
            };
        }
        catch (error) {
            this.logger.error(`Error fetching dashboard summary: ${error.message}`);
            throw error;
        }
    }
    async getWorkerEligibilityDistribution() {
        const eligibleCount = await this.userModel.countDocuments({
            role: user_enum_1.Role.WORKER,
            isEligible: true,
        });
        const nonEligibleCount = await this.userModel.countDocuments({
            role: user_enum_1.Role.WORKER,
            isEligible: false,
        });
        const pendingCount = await this.userModel.countDocuments({
            role: user_enum_1.Role.WORKER,
            isEligible: null,
        });
        this.logger.log(`Worker eligibility stats: Eligible=${eligibleCount}, Non-Eligible=${nonEligibleCount}, Pending=${pendingCount}`);
        return [
            { name: 'Eligible', value: eligibleCount },
            { name: 'Not Eligible', value: nonEligibleCount },
            { name: 'Pending', value: pendingCount },
        ];
    }
    async getTaskValidationDistribution() {
        const validatedCount = await this.taskModel.countDocuments({
            isValidQuestion: true,
        });
        const totalTasks = await this.taskModel.countDocuments();
        const nonValidatedCount = totalTasks - validatedCount;
        return [
            { name: 'Validated', value: validatedCount },
            { name: 'Not Validated', value: nonValidatedCount },
        ];
    }
    async getAccuracyDistribution() {
        const eligibilityRecords = await this.eligibilityModel.find().exec();
        const accuracyBrackets = {
            '90-100%': 0,
            '80-89%': 0,
            '70-79%': 0,
            'Below 70%': 0,
        };
        for (const record of eligibilityRecords) {
            const accuracy = record.accuracy || 0;
            if (accuracy >= 0.9) {
                accuracyBrackets['90-100%']++;
            }
            else if (accuracy >= 0.8) {
                accuracyBrackets['80-89%']++;
            }
            else if (accuracy >= 0.7) {
                accuracyBrackets['70-79%']++;
            }
            else {
                accuracyBrackets['Below 70%']++;
            }
        }
        return Object.entries(accuracyBrackets).map(([name, value]) => ({
            name,
            value: value || 0,
        }));
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = DashboardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(task_1.Task.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_1.Users.name)),
    __param(2, (0, mongoose_1.InjectModel)(eligibility_1.Eligibility.name)),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object, typeof (_b = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _b : Object, typeof (_c = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _c : Object])
], DashboardService);


/***/ }),
/* 62 */
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
exports.ThresholdSettingsInput = void 0;
const graphql_1 = __webpack_require__(5);
const class_validator_1 = __webpack_require__(63);
const utils_1 = __webpack_require__(42);
let ThresholdSettingsInput = class ThresholdSettingsInput {
};
exports.ThresholdSettingsInput = ThresholdSettingsInput;
__decorate([
    (0, graphql_1.Field)(() => String),
    (0, class_validator_1.IsEnum)(utils_1.ThresholdType),
    __metadata("design:type", String)
], ThresholdSettingsInput.prototype, "thresholdType", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], ThresholdSettingsInput.prototype, "thresholdValue", void 0);
exports.ThresholdSettingsInput = ThresholdSettingsInput = __decorate([
    (0, graphql_1.InputType)()
], ThresholdSettingsInput);


/***/ }),
/* 63 */
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),
/* 64 */
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
var MissingWorkerIdCronService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MissingWorkerIdCronService = void 0;
const common_1 = __webpack_require__(3);
const mongoose_1 = __webpack_require__(4);
const mongoose_2 = __webpack_require__(13);
const recorded_1 = __webpack_require__(22);
const user_1 = __webpack_require__(32);
let MissingWorkerIdCronService = MissingWorkerIdCronService_1 = class MissingWorkerIdCronService {
    constructor(recordedAnswerModel, usersModel) {
        this.recordedAnswerModel = recordedAnswerModel;
        this.usersModel = usersModel;
        this.logger = new common_1.Logger(MissingWorkerIdCronService_1.name);
    }
    async handleCron() {
        try {
            const recordedWorkerIds = await this.recordedAnswerModel.distinct('workerId');
            const userIds = await this.usersModel.distinct('_id');
            const missingWorkerIds = recordedWorkerIds.filter((recordedId) => {
                return !userIds.some((userId) => userId.toString() === recordedId.toString());
            });
            this.logger.log(`Missing worker IDs: ${missingWorkerIds}`);
            if (missingWorkerIds.length > 0) {
                const result = await this.recordedAnswerModel.deleteMany({
                    workerId: { $in: missingWorkerIds },
                });
                this.logger.log(`Deleted ${result.deletedCount} recordedAnswer documents with missing worker IDs.`);
            }
            else {
                this.logger.log('No missing worker IDs found, no documents deleted.');
            }
        }
        catch (error) {
            this.logger.error('Error saat menghapus recordedAnswer dengan missing worker IDs:', error);
        }
    }
};
exports.MissingWorkerIdCronService = MissingWorkerIdCronService;
exports.MissingWorkerIdCronService = MissingWorkerIdCronService = MissingWorkerIdCronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(recorded_1.RecordedAnswer.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_1.Users.name)),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object, typeof (_b = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _b : Object])
], MissingWorkerIdCronService);


/***/ }),
/* 65 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthModule = void 0;
const common_1 = __webpack_require__(3);
const auth_resolver_1 = __webpack_require__(66);
const users_module_1 = __webpack_require__(31);
const auth_service_1 = __webpack_require__(68);
const mongoose_1 = __webpack_require__(4);
const auth_1 = __webpack_require__(67);
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
/* 66 */
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
const graphql_1 = __webpack_require__(5);
const auth_1 = __webpack_require__(67);
const auth_service_1 = __webpack_require__(68);
const auth_view_1 = __webpack_require__(71);
const create_auth_input_1 = __webpack_require__(72);
const user_view_1 = __webpack_require__(45);
const role_decorator_1 = __webpack_require__(29);
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
    __metadata("design:paramtypes", [typeof (_a = typeof auth_service_1.AuthService !== "undefined" && auth_service_1.AuthService) === "function" ? _a : Object])
], AuthResolver);


/***/ }),
/* 67 */
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
const graphql_1 = __webpack_require__(5);
const mongoose_1 = __webpack_require__(4);
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
/* 68 */
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
const common_1 = __webpack_require__(3);
const mongoose_1 = __webpack_require__(13);
const create_user_service_1 = __webpack_require__(36);
const get_user_service_1 = __webpack_require__(49);
const config_service_1 = __webpack_require__(8);
const jwt = __webpack_require__(51);
const bcrypt = __webpack_require__(69);
const gqlerr_1 = __webpack_require__(15);
const auth_1 = __webpack_require__(67);
const parser_1 = __webpack_require__(70);
const mongoose_2 = __webpack_require__(4);
const parser_2 = __webpack_require__(35);
let AuthService = class AuthService {
    constructor(authModel, createUserService, getUserService) {
        this.authModel = authModel;
        this.createUserService = createUserService;
        this.getUserService = getUserService;
    }
    async login(input) {
        try {
            let user;
            const { identifier, password } = input;
            if (identifier.includes('@')) {
                user = await this.getUserService.getUserByEmail(identifier);
            }
            else {
                user = await this.getUserService.getUserByUsername(identifier);
            }
            if (!user) {
                throw new gqlerr_1.ThrowGQL('Invalid credentials', gqlerr_1.GQLThrowType.NOT_AUTHORIZED);
            }
            const secretKey = config_service_1.configService.getEnvValue('SECRET_KEY');
            const isPasswordValid = await bcrypt.compare(password, user.password);
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
/* 69 */
/***/ ((module) => {

module.exports = require("bcrypt");

/***/ }),
/* 70 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parseRegisterInput = parseRegisterInput;
const gqlerr_1 = __webpack_require__(15);
const bcrypt = __webpack_require__(69);
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
/* 71 */
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
const graphql_1 = __webpack_require__(5);
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
/* 72 */
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
const graphql_1 = __webpack_require__(5);
const class_validator_1 = __webpack_require__(63);
const user_enum_1 = __webpack_require__(30);
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
    (0, class_validator_1.MinLength)(7),
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
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LoginInput.prototype, "identifier", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(6),
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
/* 73 */
/***/ ((module) => {

module.exports = require("@nestjs/throttler");

/***/ }),
/* 74 */
/***/ ((module) => {

module.exports = require("cookie-parser");

/***/ })
/******/ 	]);
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
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	
/******/ })()
;