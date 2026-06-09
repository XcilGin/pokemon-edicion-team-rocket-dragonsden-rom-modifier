# 口袋妖怪西班牙火箭队ROM修改器

——百度贴吧 祖鲁桃源

本项目是一款面向零基础玩家的本地 ROM 修改器，用于修改《口袋妖怪西班牙火箭队》GBA ROM 的部分宝可梦和招式参数。工具在浏览器中运行，打开本地 `.gba` 文件后进行编辑，保存时会下载一份新的 ROM 副本，原文件不会被覆盖。

项目不包含 ROM 文件、游戏资源文件或存档文件。

<img width="2804" height="1324" alt="屏幕截图 2026-06-09 191228" src="https://github.com/user-attachments/assets/a4b0731d-e3e3-44bb-96e8-cf3a26a8b43d" />


## 功能

### 宝可梦编辑

- 六项种族值：HP、攻击、防御、速度、特攻、特防
- 属性 1、属性 2
- 普通特性 1、普通特性 2、隐藏特性

### 招式编辑

- 威力、命中率、PP
- 属性、分类
- 优先级、二级效果概率
- 目标范围

## 使用方法

1. 双击 `点我打开修改器.bat`。如果系统对中文文件名兼容不好，也可以双击 `start.bat`。
2. 浏览器打开后点击 `打开 ROM`，选择 `.gba` 文件。
3. 在 `宝可梦` 或 `招式` 页面修改需要的内容。
4. 在 `保存` 页面点击 `保存副本`。

## 运行要求

- Windows
- Python 3 或 Windows `py` 启动器
- 现代浏览器

## 文件结构

```text
口袋妖怪西班牙火箭队ROM修改器
├─ 点我打开修改器.bat
├─ start.bat
├─ start_modifier.ps1
├─ README.txt
├─ README.md
└─ app
   ├─ index.html
   ├─ styles.css
   ├─ app.js
   └─ data
      └─ catalog.json
```

## 注意

- 工具修改 ROM 文件，不修改存档文件。
- 工具适配当前《口袋妖怪西班牙火箭队》底版，其他 ROM 可能无法打开。
- 修改后建议先保留原 ROM 备份，再在模拟器中测试。

---

# Pokémon Edición Team Rocket (DragonsDen) ROM Modifier

By Baidu Tieba user Zulu Taoyuan

This project is a beginner-friendly local ROM modifier for the GBA ROM hack Pokemon Spanish Rocket Team. It runs in a browser, reads a local `.gba` file, edits selected Pokemon and move parameters, and downloads a new modified ROM copy. The original ROM file is not overwritten.

This repository does not include any ROM file, game asset file, or save file.

## Features

### Pokemon Editor

- Base stats: HP, Attack, Defense, Speed, Special Attack, Special Defense
- Type 1 and Type 2
- Ability 1, Ability 2, and Hidden Ability

### Move Editor

- Power, Accuracy, and PP
- Type and Category
- Priority, Secondary Effect Chance, and Target

## Usage

1. Double-click `点我打开修改器.bat`. If your system has trouble with Chinese filenames, double-click `start.bat` instead.
2. After the browser opens, click `打开 ROM` and choose a `.gba` file.
3. Edit the desired entries in the `宝可梦` or `招式` page.
4. Open the `保存` page and click `保存副本`.

## Requirements

- Windows
- Python 3 or the Windows `py` launcher
- A modern browser

## Notes

- This tool edits ROM files. It does not edit save files.
- The tool is designed for the current Pokemon Spanish Rocket Team base ROM. Other ROMs may not open.
- Keep a backup of the original ROM and test the modified copy in an emulator.
