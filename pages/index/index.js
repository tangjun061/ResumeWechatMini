import { apiBaseUrl } from '../../config'

Page({
    data: {
        resumeFile: null,
        jobDescription: '',
        invitationCode: '',
        canOptimize: false
    },

    onLoad(options) {
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
    },

    chooseFile() {
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
                this.setData({ resumeFile: file })
                this.checkOptimizeStatus()
                this.saveState()
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
        wx.showLoading({
            title: '优化中...',
            mask: true
        })

        wx.uploadFile({
            url: `${apiBaseUrl}/resume/optimize-pro-content`,
            filePath: this.data.resumeFile.path,
            name: 'file',
            formData: {
                job_description: this.data.jobDescription,
                invitation_code: this.data.invitationCode
            },
            success: (res) => {
                try {
                    const data = JSON.parse(res.data)
                    // 检查响应状态码和错误码
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
                        wx.hideLoading()
                        return
                    }

                    // 只有在成功的情况下才跳转
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
                wx.hideLoading()
            }
        })
    }
}) 