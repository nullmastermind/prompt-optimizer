# 项目经验总结（优化版）  

## 📋 快速索引  
- [架构设计](#架构设计)  
- [错误处理](#错误处理)  
- [测试规范](#测试规范)  
- [Vue开发](#vue开发)  
- [工具与配置](#工具与配置)  
- [关键重构经验](#关键重构经验)  

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