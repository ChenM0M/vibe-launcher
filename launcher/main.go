package main

import (
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"time"
)

func main() {
	fmt.Println("🚀 VibeCoding Project Gallery 启动中...")

	// 获取程序所在目录
	exePath, err := os.Executable()
	if err != nil {
		fmt.Printf("❌ 获取程序路径失败: %v\n", err)
		waitForExit()
		return
	}
	workDir := filepath.Dir(exePath)

	// 1. 启动后端服务器
	fmt.Println("📦 [1/3] 启动后端服务器...")
	backendPath := filepath.Join(workDir, "backend", "server.js")
	
	// 检查文件是否存在
	if _, err := os.Stat(backendPath); os.IsNotExist(err) {
		fmt.Printf("❌ 找不到后端文件: %s\n", backendPath)
		waitForExit()
		return
	}

	// 启动Node.js后端
	cmd := exec.Command("node", backendPath)
	cmd.Dir = workDir
	cmd.Env = append(os.Environ(),
		"NODE_ENV=production",
		"PORT=5000",
	)
	
	// 捕获输出用于调试
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		fmt.Printf("❌ 启动后端失败: %v\n", err)
		fmt.Println("💡 请确保已安装 Node.js")
		waitForExit()
		return
	}

	// 确保程序退出时关闭后端
	defer func() {
		if cmd.Process != nil {
			cmd.Process.Kill()
		}
	}()

	// 2. 等待服务器就绪
	fmt.Println("⏳ [2/3] 等待服务就绪...")
	if !waitForServer("http://localhost:5000/api/health", 30) {
		fmt.Println("❌ 服务器启动超时")
		waitForExit()
		return
	}

	// 3. 打开浏览器
	fmt.Println("🌐 [3/3] 打开浏览器界面...")
	openBrowser("http://localhost:5000")

	fmt.Println()
	fmt.Println("✅ 启动完成！")
	fmt.Println("📌 浏览器已打开，可以开始使用")
	fmt.Println("⚠️  请不要关闭此窗口")
	fmt.Println()
	fmt.Println("按 Ctrl+C 或关闭此窗口将停止服务...")

	// 保持运行
	cmd.Wait()
}

// 等待服务器就绪
func waitForServer(url string, maxRetries int) bool {
	for i := 0; i < maxRetries; i++ {
		resp, err := http.Get(url)
		if err == nil && resp.StatusCode == 200 {
			resp.Body.Close()
			return true
		}
		time.Sleep(time.Second)
		if i%5 == 0 && i > 0 {
			fmt.Printf("   等待中... (%d/%d)\n", i, maxRetries)
		}
	}
	return false
}

// 打开浏览器
func openBrowser(url string) {
	var cmd *exec.Cmd
	cmd = exec.Command("cmd", "/c", "start", url)
	cmd.Start()
}

// 等待用户按键退出
func waitForExit() {
	fmt.Println()
	fmt.Print("按回车键退出...")
	fmt.Scanln()
}
