import { apiBaseUrl } from '../../config'

Page({
    data: {
        resumeId: '',
        optimizedContent: '',
        analysisReport: '',
        activeTab: 'resume',
        isDownloading: false
    },

    onLoad(options) {
        console.log('接收到的参数:', options)
        this.setData({
            resumeId: options.resumeId,
            optimizedContent: decodeURIComponent(options.content),
            analysisReport: options.report ? decodeURIComponent(options.report) : '暂无优化报告'
        })
        console.log('设置后的数据:', this.data)
    },

    switchTab(e) {
        const tab = e.currentTarget.dataset.tab
        this.setData({ activeTab: tab })
    },

    handleBack() {
        wx.navigateBack()
    },

    handleDownload() {
        this.setData({
            isDownloading: true
        })

        wx.showLoading({
            title: '准备下载...',
            mask: true
        })

        const downloadUrl = `${apiBaseUrl}/resume/download/${this.data.resumeId}`

        wx.downloadFile({
            url: downloadUrl,
            success: (res) => {
                if (res.statusCode === 200) {
                    wx.openDocument({
                        filePath: res.tempFilePath,
                        fileType: 'pdf',
                        showMenu: true,
                        success: () => {
                            wx.showToast({
                                title: '下载成功',
                                icon: 'success'
                            })
                        }
                    })
                }
            },
            fail: (error) => {
                wx.showToast({
                    title: '下载失败，请重试',
                    icon: 'none'
                })
                console.error('下载失败:', error)
            },
            complete: () => {
                wx.hideLoading()
                this.setData({
                    isDownloading: false
                })
            }
        })
    },

    onShow() {
        // 添加进入动画
        wx.pageScrollTo({
            scrollTop: 0,
            duration: 300
        })
    }
}) 