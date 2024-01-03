import axios from 'axios'

const handleLogout = async (req, res) => {
    const {token} = req.body

    try {
        await axios.delete('https://api-v2.upstox.com/logout', {
          headers: {
            'accept': 'application/json',
            'Api-Version': '2.0',
            'Authorization': `Bearer ${token}`
          }
        });
        
        res.status(200).json({
            success: true,
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            error,
        })
    }

}

export default handleLogout
