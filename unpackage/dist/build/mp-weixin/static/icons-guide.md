# 图标使用指南

## 底部导航图标说明

当前项目使用了临时的占位符图标来配置底部导航栏。为了获得更好的视觉效果，建议您替换为专门设计的图标。

## 图标规格要求

### 尺寸要求
- **图标尺寸**: 48x48 像素（推荐）
- **文件格式**: PNG（建议使用透明背景）
- **文件大小**: 每个图标建议小于10KB

### 图标设计规范
- **普通状态**: 使用灰色调 (#999999)
- **选中状态**: 使用蓝色调 (#007AFF) 或品牌色
- **风格**: 简洁的线性图标，符合现代UI设计风格
- **视觉重量**: 保持一致的线条粗细和视觉重量

## 需要的图标文件

请准备以下8个图标文件，放置在 `static/` 目录下：

### 1. 首页图标
- `tab_home.png` - 普通状态（房子图标）
- `tab_home_active.png` - 选中状态

### 2. 学习图标  
- `tab_study.png` - 普通状态（书本图标）
- `tab_study_active.png` - 选中状态

### 3. 题库图标
- `tab_question.png` - 普通状态（题目/测试图标）
- `tab_question_active.png` - 选中状态

### 4. 我的图标
- `tab_profile.png` - 普通状态（用户图标）
- `tab_profile_active.png` - 选中状态

## 替换步骤

1. **准备图标文件**: 按照上述规格准备8个图标文件
2. **放置文件**: 将图标文件放入 `static/` 目录
3. **更新配置**: 修改 `pages.json` 中的 `tabBar` 配置：

```json
"tabBar": {
  "list": [
    {
      "pagePath": "pages/index/index",
      "iconPath": "static/tab_home.png",
      "selectedIconPath": "static/tab_home_active.png",
      "text": "首页"
    },
    // ... 其他配置
  ]
}
```

## 图标资源推荐

### 免费图标库
- **IconFont** (iconfont.cn) - 阿里图标库
- **Feather Icons** - 简洁线性图标
- **Heroicons** - Tailwind CSS 图标库
- **Tabler Icons** - 免费SVG图标

### 设计工具
- **Figma** - 在线设计工具
- **Sketch** - Mac设计工具  
- **Adobe Illustrator** - 专业矢量设计

## 注意事项

- 所有图标应保持统一的设计风格
- 确保图标在不同设备上都清晰可见
- 测试图标在深色和浅色背景下的效果
- 考虑无障碍设计，确保图标含义清晰明确

---

*提示：当前项目已配置了临时图标，您可以直接运行查看效果，后续根据需要更换为专业设计的图标。* 