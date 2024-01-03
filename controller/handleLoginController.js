import open from 'open'

const handleLoginController = async (request, response) => {
try {
    await open('https://api-v2.upstox.com/login/authorization/dialog?response_type=code&client_id=4d6b76cf-b3c2-4146-847d-f82550bf7480&redirect_uri=http://localhost:8080/access-code')
    response.status(200).json({
        success:true
    })
} catch (error) {
    response.status(400).json({
        success:false,
        error,
    })
}
}

export default handleLoginController
