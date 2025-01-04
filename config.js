const config = {
    development: {
        apiBaseUrl: 'http://192.168.31.77:8000/api/v1'
    },
    production: {
        apiBaseUrl: 'https://your-production-api.com/api/v1'
    }
}

const env = 'development'
export const apiBaseUrl = config[env].apiBaseUrl 