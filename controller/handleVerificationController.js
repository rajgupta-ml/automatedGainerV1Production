import axios from 'axios';
import querystring from 'querystring';
import cookie from 'cookie';

const handleVerificationController = async (req, res) => {
    const {accessCode} = req.body;
    const data = {
        "code" : accessCode,
        "client_id": "4d6b76cf-b3c2-4146-847d-f82550bf7480",
        "client_secret": "7yb94vqora",
        "redirect_uri": 'http://localhost:8080/access-code',
        "grant_type": "authorization_code",
    }

    const formData = querystring.stringify(data);

    const options = {
        headers: {
            "accept" : "application/json",
            "api-version" : "2.0",
            "Content-type" : "application/x-www-form-urlencoded",
        }
    }

 try {
    const response = await axios.post("https://api-v2.upstox.com/login/authorization/token", formData, options)
    const token = response.data.access_token;
    console.log(response.data.access_token);
    
    res.status(200).json({
      success: true,
      token,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error,
    });
  }

}

export default handleVerificationController
