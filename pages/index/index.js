import { apiBaseUrl } from '../../config'

Page({
    data: {
        resumeFile: null,
        jobDescription: '',
        invitationCode: 'MarsCodeInvs2025',
        canOptimize: false,
        isOptimizing: false,
        isUploading: false,
        isLoading: true,
        uploadProgress: 0,
        optimizeProgress: 0,
        currentStep: '',
        stepDescription: '',
        progressTimer: null,
        progressText: '0%',
        progressStars: ''
    },

    onLoad(options) {
        wx.showLoading({
            title: '加载中...',
            mask: true
        })

        // 接收URL参数
        if (options.invitation_code) {
            this.setData({
                invitationCode: options.invitation_code
            })
            this.checkOptimizeStatus()
        }

        // 从缓存恢复状态
        const savedState = wx.getStorageSync('resumeState')
        if (savedState) {
            this.setData({
                resumeFile: savedState.resumeFile,
                jobDescription: savedState.jobDescription,
                invitationCode: savedState.invitationCode
            })
            this.checkOptimizeStatus()
        }

        // 模拟加载完成
        setTimeout(() => {
            this.setData({ isLoading: false })
            wx.hideLoading()
        }, 500)
    },

    onShow() {
        // 页面显示时的动画效果
        if (!this.data.isLoading) {
            wx.pageScrollTo({
                scrollTop: 0,
                duration: 300
            })
        }
    },

    chooseFile() {
        if (this.data.isUploading) return;  // 防止重复点击

        this.setData({
            isUploading: true
        })

        wx.chooseMessageFile({
            count: 1,
            type: 'file',
            extension: ['pdf', 'docx'],
            success: (res) => {
                const file = res.tempFiles[0]
                // 检查文件大小是否超过1MB
                const maxSize = 1 * 1024 * 1024; // 1MB in bytes
                if (file.size > maxSize) {
                    wx.showToast({
                        title: '文件大小不能超过1MB',
                        icon: 'none',
                        duration: 2000
                    })
                    return
                }
                this.setData({
                    resumeFile: file,
                    isUploading: false
                })
                this.checkOptimizeStatus()
                this.saveState()
            },
            fail: () => {
                this.setData({
                    isUploading: false
                })
            },
            complete: () => {
                this.setData({
                    isUploading: false
                })
            }
        })
    },

    onDescriptionInput(e) {
        this.setData({
            jobDescription: e.detail.value
        })
        this.checkOptimizeStatus()
        this.saveState()
    },

    onInvitationInput(e) {
        this.setData({
            invitationCode: e.detail.value
        })
        this.checkOptimizeStatus()
        this.saveState()
    },

    checkOptimizeStatus() {
        const canOptimize = this.data.resumeFile &&
            this.data.jobDescription.trim().length > 0 &&
            this.data.jobDescription.length <= 300 &&
            this.data.invitationCode.trim().length > 0
        this.setData({ canOptimize })
    },

    saveState() {
        wx.setStorageSync('resumeState', {
            resumeFile: this.data.resumeFile,
            jobDescription: this.data.jobDescription,
            invitationCode: this.data.invitationCode
        })
    },

    handleOptimize() {
        if (this.data.isOptimizing) return;

        this.setData({
            isOptimizing: true,
            optimizeProgress: 0,
            currentStep: '准备上传',
            stepDescription: '正在准备文件...'
        })

        // 启动进度模拟
        this.simulateOptimizeProgress();

        wx.uploadFile({
            url: `${apiBaseUrl}/resume/optimize-pro-content`,
            filePath: this.data.resumeFile.path,
            name: 'file',
            formData: {
                job_description: this.data.jobDescription,
                invitation_code: 'MarsCodeInvs2025'
            },
            onProgressUpdate: (res) => {
                this.setData({
                    uploadProgress: res.progress,
                    currentStep: '文件上传',
                    stepDescription: '正在上传简历文件...',
                    progressText: res.progress + '%'
                })
            },
            success: (res) => {
                try {
                    const data = JSON.parse(res.data)
                    if (res.statusCode === 403) {
                        const errorData = JSON.parse(res.data)
                        wx.showModal({
                            title: '提示',
                            content: errorData.detail.detail || '邀请码无效',
                            showCancel: false,
                            confirmText: '确定',
                            confirmColor: '#07c160',
                            className: 'custom-modal',
                        })
                        return
                    }

                    if (res.statusCode === 200) {
                        wx.navigateTo({
                            url: `/pages/result/result?resumeId=${data.resume_id}&content=${encodeURIComponent(data.optimized_content)}&report=${encodeURIComponent(data.analysis_report)}`
                        })
                    }
                } catch (error) {
                    wx.showToast({
                        title: '优化失败，请重试',
                        icon: 'none'
                    })
                    console.error('优化失败:', error)
                }
            },
            fail: (error) => {
                wx.showToast({
                    title: '优化失败，请重试',
                    icon: 'none'
                })
                console.error('优化失败:', error)
            },
            complete: () => {
                if (this.data.progressTimer) {
                    clearInterval(this.data.progressTimer)
                }
                this.setData({
                    isOptimizing: false,
                    uploadProgress: 0,
                    optimizeProgress: 0,
                    currentStep: '',
                    stepDescription: ''
                })
            }
        })
    },

    simulateOptimizeProgress() {
        const steps = [
            { progress: 20, step: '分析简历', desc: '正在分析简历内容...' },
            { progress: 40, step: '提取信息', desc: '正在提取关键信息...' },
            { progress: 60, step: '匹配岗位', desc: '正在与岗位要求匹配...' },
            { progress: 80, step: '优化内容', desc: '正在优化简历内容...' },
            { progress: 95, step: '生成报告', desc: '正在生成分析报告...' }
        ];

        // 清除之前的定时器
        if (this.data.progressTimer) {
            clearInterval(this.data.progressTimer)
        }

        // 重置进度
        this.setData({ optimizeProgress: 0 })

        // 启动进度条，45秒内从0到100
        const startTime = Date.now();
        const duration = 55000; // 45秒

        const timer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            const progressInt = Math.floor(progress);

            // 计算星号数量（最多10个）
            const starsCount = Math.floor((progressInt / 100) * 10);
            const stars = '★'.repeat(starsCount).padEnd(10, '☆');

            this.setData({
                optimizeProgress: progress,
                currentStep: steps.find(step => progress >= step.progress)?.step || steps[0].step,
                stepDescription: steps.find(step => progress >= step.progress)?.desc || steps[0].desc,
                progressText: progressInt + '%',
                progressStars: stars
            });

            if (progress >= 100) {
                clearInterval(timer);
            }
        }, 100);

        this.setData({ progressTimer: timer });
    },

    onUnload() {
        if (this.data.progressTimer) {
            clearInterval(this.data.progressTimer)
        }
        this.setData({
            isOptimizing: false,
            isUploading: false,
            uploadProgress: 0,
            optimizeProgress: 0,
            currentStep: '',
            stepDescription: ''
        })
    }
}) 