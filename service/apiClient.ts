import axios from 'axios'

const apiClient = axios.create({
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
})

apiClient.interceptors.request.use(config => {
    console.log(`Request Method: ${config.method?.toUpperCase()} | Endpoint: ${config.url}`)
    return config
})

apiClient.interceptors.response.use(response => {
    console.log(`Response Status: ${response.status} | Response Data: ${JSON.stringify(response.data)}`)
    return response
})

export default apiClient