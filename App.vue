<script>
import { useAuthStore } from '@/stores/auth.js'
import NavigationGuard from '@/utils/navigationGuard.js'

export default {
	async onLaunch() {
		console.warn('当前组件仅支持 uni_modules 目录结构 ，请升级 HBuilderX 到 3.1.0 版本以上！')
		console.log('🚀 App Launch - 应用启动')
		
		try {
			// 设置导航守卫
			NavigationGuard.setupAutoLoginInterceptor()
			
			// 获取认证store并初始化状态
			const authStore = useAuthStore()
			await authStore.initAuthState()
			console.log('✅ 认证状态初始化完成')
		} catch (error) {
			console.error('❌ 认证状态初始化失败:', error)
		}
	},
	
	onShow() {
		console.log('👁️ App Show - 应用显示')
		
		// 应用显示时检查登录状态
		const authStore = useAuthStore()
		authStore.checkAuthStatus()
		
		// 检查当前页面权限
		NavigationGuard.checkCurrentPagePermission()
	},
	
	onHide() {
		console.log('🙈 App Hide - 应用隐藏')
	}
}
</script>

<style lang="scss">
	/*每个页面公共css */
	@import '@/uni_modules/uni-scss/index.scss';
	@import "katex/dist/katex.min.css";
	/* #ifndef APP-NVUE */
	@import '@/static/customicons.css';
	// 设置整个项目的背景色
	page {
		background-color: #f5f5f5;
	}

	/* #endif */
	.example-info {
		font-size: 14px;
		color: #333;
		padding: 10px;
	}
</style>
