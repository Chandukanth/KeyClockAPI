const Register = async (req, res) => {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);

    try {
        await sgMail.send({
            to: email,
            from: 'chandrakanth.k@vvglobalsolutions.co',
            subject: "Verify Your Email",
            text: `Your OTP is: ${otp}`,
        });
        otpStore[email] = otp;
        res.status(200).send("OTP sent to email");
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to send email");
    }
}
export default Register;