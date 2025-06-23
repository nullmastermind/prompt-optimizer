# 项目经验总结（优化版）  

## 📋 快速索引  
- [架构设计](#架构设计)  
- [错误处理](#错误处理)  
- [测试规范](#测试规范)  
- [Vue开发](#vue开发)  
- [工具与配置](#工具与配置)  
- [关键重构经验](#关键重构经验)  
- [API密钥管理经验](#api密钥管理经验)  
- [自定义API集成经验](#自定义API集成经验)  

---

## 架构设计  

### API集成规范  
1. **配置分离**  
   - 业务逻辑与API配置解耦  
   - 统一接口格式（OpenAI兼容）  
   - 独立管理提示词模板  
   ```js
   // 配置示例
   export default {
     baseURL: "https://api.openai.com/v1",
     models: ["gpt-4", "gpt-3.5"]
   }
   ```

2. **模块化结构**  
   ```src
   ├─ api/       # API封装
   ├─ services/  # 业务逻辑
   ├─ config/    # 全局配置
   ├─ components/# UI组件
   └─ prompts/   # 提示模板库
   ```

### LLM服务架构  
| 设计要点          | 实现方案                     |
|-------------------|----------------------------|
| 接口标准化        | 统一使用OpenAI格式          |
| 多服务商兼容      | Provider标识区分（如Gemini）|
| 动态配置更新      | 支持热加载配置              |
| 敏感信息管理      | 环境变量+本地加密存储       |

---

## 错误处理  

### 典型问题与修复  
| 问题场景                  | 解决方案                     | 发生日期   |
|--------------------------|----------------------------|------------|
| 模板ID与模型Key混淆       | 明确功能ID与API Key分离     | 2024-03-22 |
| 状态同步异常              | 增加状态同步处理函数        | 2024-03-22 |
| 全局currentProvider污染   | 显式传递模型参数            | 2024-03-22 |

### 处理原则  
1. **开发环境**：保留完整错误堆栈  
2. **生产环境**：友好提示+日志记录  
3. **通用规则**：  
   ```js
   try {
     await apiCall();
   } catch (err) {
     console.error("[API Error]", err.context);
     throw new Error("服务调用失败，请检查配置");
   }
   ```

---

## 测试规范  

### 核心要点  
1. **环境变量**  
   ```js
   // Vite项目必须使用import.meta.env
   const apiKey = import.meta.env.VITE_GEMINI_KEY; 
   ```

2. **测试架构**  
   - 集中管理多服务商配置  
   - 独立测试数据库  
   - 模拟异常场景（网络错误/无效Token）  

3. **用例设计**  
   ```js
   describe("API测试", () => {
     it("应正确处理多轮对话", async () => {
       const response = await sendRequest(messages);
       expect(response.content).toMatch(/优化建议/);
     });
   });
   ```

---

## Vue开发  

### 组件规范  
1. **Composable使用**  
   ```js
   // 正确用法
   const { data } = useFetch();
   // 错误用法
   onMounted(() => {
     const { data } = useFetch(); // 禁止在生命周期内调用
   });
   ```

2. **状态同步方案**  
   ```vue
   <!-- 父组件 -->
   <ModelManager @update="handleModelUpdate" />

   <!-- 子组件 -->
   <script setup>
   const emit = defineEmits(['update']);
   const updateModel = () => {
     emit('update', newModels);
   }
   </script>
   ```

### UI设计准则  
| 分类        | 规范                          |
|------------|------------------------------|
| 布局系统    | 基于Tailwind的响应式网格       |
| 主题管理    | CSS变量+透明度层级控制         |
| 交互反馈    | 加载状态/禁用状态/过渡动画      |

---

## 工具与配置  

### NPM管理  
```bash
# 常用命令
npm outdated          # 检查可更新包
ncu -u "eslint*"      # 安全更新指定包
```

### 版本策略  
| 符号 | 含义                | 示例          |
|------|---------------------|---------------|
| ^    | 允许小版本更新       | ^1.2.3 → 1.3.0|
| ~    | 仅允许补丁更新       | ~1.2.3 → 1.2.4|

### YAML处理  
1. **常见错误**  
   ```yaml
   # 错误示例
   -invalid: 缺少空格
   tags: 
     -test  # 列表格式错误
   ```
   
2. **修复方案**  
   ```yaml
   # 正确格式
   valid_key: "值"
   tags:
     - test
     - template
   ```

---

## 关键重构经验  

### 服务层优化（2024-03-19）  
1. **类型安全**  
   ```ts
   interface ModelConfig {
     name: string;
     baseURL: string;  // 非可选字段
     models: string[];
   }
   ```

2. **错误处理改进**  
   - 统一继承自 `LLMError` 基类  
   - 批量验证错误收集  
   ```ts
   class ValidationError extends LLMError {
     constructor(errors: string[]) {
       super(`配置验证失败: ${errors.join(', ')}`);
     }
   }
   ```

### 配置管理（2024-03-21）  
1. **模型启用验证**  
   ```ts
   function validateConfig(config) {
     if (!config.apiKey) {
       throw new Error("API Key为必填项");
     }
   }
   ```

2. **环境变量处理**  
   ```ts
   /// <reference types="vite/client" />
   interface ImportMetaEnv {
     VITE_GEMINI_KEY: string;
   }
   ```

### LLM 服务重构经验

#### LangChain 集成
- 日期：[当前日期]
- 场景：将原生 API 调用重构为 LangChain 实现
- 主要改进：
  1. 更好的可扩展性
  2. 统一的接口抽象
  3. 内置的错误处理
  4. 支持高级特性

#### 最佳实践
1. 使用模型实例缓存提高性能
2. 统一消息格式转换
3. 保持公共接口稳定
4. 分层错误处理

#### 注意事项
1. 需要安装相关依赖：
   ```bash
   npm install langchain @langchain/core @langchain/openai @langchain/anthropic
   ```
2. 不同模型提供商的配置参数可能不同
3. 建议使用 TypeScript 获得更好的类型支持

#### 未来扩展
1. 支持更多模型提供商
2. 添加高级功能：
   - 链式调用
   - 代理功能
   - 向量存储
   - 记忆管理
3. 性能优化：
   - 并发请求
   - 流式响应
   - 缓存策略

---

## API密钥管理经验

### 设计决策
1. 采用用户自管理API密钥的方式
2. 启用OpenAI库的浏览器支持
3. 提供完整的密钥管理指导

### 原因
1. 应用定位为个人工具
2. 用户可以完全控制自己的API使用
3. 避免后端服务的开销和维护
4. 保持应用的简单性和可移植性

### 安全考虑
1. 密钥由用户自行创建和管理
2. 建议用户为应用单独创建密钥
3. 推荐在OpenAI平台设置使用限制
4. 提供密钥安全使用的最佳实践指导

### 用户体验优化
1. 提供详细的API密钥获取教程
2. 添加密钥验证功能
3. 显示当前密钥的使用状态
4. 提供密钥使用的安全提示

### 技术实现
```typescript
const model = new OpenAI({
  apiKey: userProvidedKey,
  baseURL: modelConfig.baseURL,
  dangerouslyAllowBrowser: true // 必要的配置
});
```

### 最佳实践建议
1. 在本地存储中加密保存密钥
2. 提供清除密钥的功能
3. 定期提醒用户检查密钥使用情况
4. 提供密钥轮换的指导

## 测试修复经验总结

### 1. 常见测试失败原因
- 方法名不匹配：实现变更后未同步更新测试用例
- 错误消息不一致：测试期望与实际实现的错误消息格式不匹配
- 模板验证逻辑不一致：测试用例未反映最新的业务逻辑

### 2. 修复策略
- 统一错误消息格式：确保测试用例与实际代码的错误消息完全匹配
- 移除多余的模拟：删除不必要的模拟调用
- 添加缺失的模拟：确保所有必要的依赖都被正确模拟

### 3. 最佳实践
- 错误消息管理：统一定义错误消息，避免分散管理
- 测试用例维护：及时更新测试用例以反映最新的代码行为
- Mock 策略：只模拟必要的方法，避免过度模拟
- 测试覆盖：关注边界条件和异常场景的测试

### 4. 改进建议
- 使用常量定义错误消息
- 完善错误处理的类型定义
- 添加更多边界条件测试
- 创建测试辅助函数简化重复设置

### 5. 测试代码示例
```typescript
// 错误消息常量
const ERROR_MESSAGES = {
  TEMPLATE_NOT_FOUND: '模板不存在或无效',
  MANAGER_NOT_INITIALIZED: '模板管理器未初始化',
  MODEL_NOT_FOUND: '模型不存在'
} as const;

// 测试辅助函数
function setupMocks(options: {
  templateContent?: string,
  modelExists?: boolean,
  messageResult?: string
}) {
  const { templateContent, modelExists = true, messageResult } = options;
  
  if (modelExists) {
    vi.spyOn(modelManager, 'getModel').mockReturnValue(mockModelConfig);
  } else {
    vi.spyOn(modelManager, 'getModel').mockReturnValue(undefined);
  }
  
  if (templateContent !== undefined) {
    vi.spyOn(templateManager, 'getTemplate').mockResolvedValue({
      ...mockTemplate,
      template: templateContent
    });
  }
  
  if (messageResult) {
    vi.spyOn(llmService, 'sendMessage').mockResolvedValue(messageResult);
  }
}
```

### 6. 测试改进经验（2024-03-22）

#### 边界条件测试要点
1. **输入验证**
   - 空字符串处理
   - 超长输入处理
   - 特殊字符处理
   - 无效参数处理

2. **服务异常处理**
   - 超时处理
   - 空响应处理
   - 网络错误处理
   - 服务降级处理

3. **状态记录验证**
   - 历史记录完整性
   - 状态变更正确性
   - 关联关系准确性
   - 时序记录准确性

#### 测试代码组织
```typescript
describe('功能测试组', () => {
  // 基础测试
  describe('基本功能', () => {
    it('正常场景', async () => {});
    it('异常场景', async () => {});
  });

  // 边界条件
  describe('边界条件', () => {
    it('空输入', async () => {});
    it('超长输入', async () => {});
    it('特殊字符', async () => {});
  });

  // 状态管理
  describe('状态管理', () => {
    it('状态记录', async () => {});
    it('状态查询', async () => {});
    it('状态关联', async () => {});
  });
});
```

#### 测试优化技巧
1. **Mock 优化**
   ```typescript
   // 统一的 Mock 设置
   function setupServiceMocks(options: MockOptions) {
     const {
       templateContent,
       modelResponse,
       shouldFail
     } = options;

     if (shouldFail) {
       vi.spyOn(service, 'call').mockRejectedValue(new Error('预期的错误'));
     } else {
       vi.spyOn(service, 'call').mockResolvedValue(modelResponse);
     }
   }
   ```

2. **错误处理验证**
   ```typescript
   // 统一的错误处理验证
   expect(() => {
     // 触发错误的操作
   }).rejects.toThrow(expect.objectContaining({
     name: 'ValidationError',
     message: expect.stringContaining('预期的错误消息')
   }));
   ```

3. **测试数据管理**
   ```typescript
   // 集中管理测试数据
   const TEST_DATA = {
     validPrompt: '有效的提示词',
     invalidPrompt: '',
     longPrompt: 'a'.repeat(10000),
     specialChars: '!@#$%^&*()',
   } as const;
   ```

#### 改进效果
1. 测试覆盖率提升
2. 边界场景更完善
3. 代码可维护性提高
4. 测试执行效率提升

## LangChain消息类型修复经验

### 问题描述
在使用LangChain进行消息处理时,遇到类型不匹配的问题:
```typescript
Argument of type 'AIMessage' is not assignable to parameter of type 'AIMessageChunk'
```

### 原因分析
1. LangChain的消息类型有多种,包括`AIMessage`和`AIMessageChunk`
2. `AIMessageChunk`是专门用于流式响应的消息类型
3. 在调用`invoke`方法时,返回类型为`AIMessageChunk`

### 解决方案
1. 将导入语句从`AIMessage`改为`AIMessageChunk`:
```typescript
import { AIMessageChunk } from '@langchain/core/messages'
```

2. 更新所有使用`AIMessage`的地方为`AIMessageChunk`

### 最佳实践
1. 使用正确的消息类型:
   - `AIMessage`: 用于普通消息
   - `AIMessageChunk`: 用于流式响应
   - `HumanMessage`: 用于用户输入
   - `SystemMessage`: 用于系统消息
2. 在mock测试时确保使用正确的消息类型
3. 参考LangChain文档中的类型定义

### 相关文档
- [LangChain消息类型文档](https://js.langchain.com/docs/api/schema/messages)
- [LangChain流式响应文档](https://js.langchain.com/docs/modules/model_io/models/chat/streaming)

## 自定义API集成经验

### 配置要求
1. API需要支持OpenAI兼容格式
2. 响应格式需要符合以下结构：
```json
{
  "choices": [{
    "message": {
      "content": "API响应内容"
    }
  }]
}
```

### 环境变量配置
```env
# 自定义API配置
VITE_CUSTOM_API_KEY=您的API密钥
VITE_CUSTOM_API_BASE_URL=您的API基础URL
```

### 最佳实践
1. 在添加新的API时，先进行兼容性测试
2. 确保错误处理机制完善
3. 添加必要的请求头和认证信息
4. 实现请求重试机制
5. 做好日志记录

### 常见问题
1. API格式不兼容：确保响应格式符合OpenAI标准
2. 认证失败：检查API密钥配置
3. 跨域问题：配置正确的CORS设置
4. 超时处理：设置合理的超时时间

## 测试经验总结

### 1. 测试数据管理
- 每个测试用例使用独立的测试数据
- 使用动态生成的唯一标识符避免冲突
- 在添加新数据前确保清理已存在数据

### 2. 初始化状态管理
- 注意对象构造函数中的默认行为
- 不能仅依赖 beforeEach 的清理
- 需要手动处理默认值和持久化数据

### 3. 存储机制处理
- 注意 localStorage 等持久化存储的影响
- 确保正确清理所有相关的存储数据
- 考虑使用 mock 存储机制进行测试

### 4. 测试用例隔离
- 测试用例之间应该相互独立
- 每个测试用例都应该可以独立运行
- 避免测试用例之间的状态依赖

## 测试重构经验（2024-03-22）

### 1. 测试数据隔离的最佳实践
- 使用动态生成的唯一标识符
- 每个测试用例使用独立的数据空间
- 避免测试用例之间的状态依赖

### 2. 测试辅助函数设计
```typescript
// 示例：创建唯一标识符
const getUniqueKey = (prefix: string) => `${prefix}-${Date.now()}`;

// 示例：创建基础配置
const createBaseConfig = (options?: Partial<Config>) => ({
  ...defaultConfig,
  ...options
});
```

### 3. 测试代码组织
- 将通用逻辑抽取为辅助函数
- 使用 beforeEach 进行状态初始化
- 保持测试用例的独立性和可读性

### 4. 配置管理优化
- 集中管理测试配置
- 支持配置的部分覆盖
- 便于统一修改和维护

### 5. 改进效果
- 提高了测试的可靠性
- 减少了代码重复
- 简化了测试维护
- 提升了测试执行效率

## 开发经验总结

## 流式处理最佳实践

### 1. 统一使用流式API
- 避免使用非流式API
- 不提供降级方案
- 确保所有操作都支持流式处理

### 2. 流式处理器设计
```typescript
// 标准流式处理器结构
interface StreamHandlers {
  onToken: (token: string) => void;   // 处理每个token
  onComplete: () => void;             // 处理完成回调
  onError: (error: Error) => void;    // 处理错误
}

// 使用示例
const streamHandlers = {
  onToken: (token) => {
    result.value += token;  // 实时更新UI
  },
  onComplete: () => {
    isLoading.value = false;
    toast.success('处理完成');
  },
  onError: (error) => {
    isLoading.value = false;
    toast.error(error.message);
  }
};
```

### 3. 错误处理
- 实时显示错误信息
- 保持UI状态同步
- 提供友好的错误提示

### 4. 状态管理
- 使用响应式变量
- 实时更新处理状态
- 正确处理加载状态

### 5. 性能优化
- 避免频繁的DOM更新
- 使用防抖处理用户输入
- 合理设置缓冲区大小

### 6. 用户体验
- 显示实时处理进度
- 提供取消处理选项
- 保持界面响应性

## 注意事项
1. 确保所有API都支持流式处理
2. 处理网络异常情况
3. 合理管理内存使用
4. 保持代码可维护性

## 最佳实践示例
```typescript
// 1. 定义处理器
const createStreamHandlers = (options: {
  onUpdate: (text: string) => void,
  onSuccess: () => void,
  onError: (error: Error) => void
}) => ({
  onToken: (token: string) => {
    options.onUpdate(token);
  },
  onComplete: () => {
    options.onSuccess();
  },
  onError: (error: Error) => {
    options.onError(error);
  }
});

// 2. 使用处理器
const handleStream = async () => {
  const handlers = createStreamHandlers({
    onUpdate: (text) => {
      result.value += text;
    },
    onSuccess: () => {
      toast.success('处理完成');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  await service.processStream(input, handlers);
};
```