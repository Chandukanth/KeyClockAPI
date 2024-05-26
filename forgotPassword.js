const ForgotPassword = async (req, res) => {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);

    try {
        await sgMail.send({
            to: email,
            from: 'chandrakanth.k@vvglobalsolutions.co',
            subject: "Password Reset Request",
            text: `Your OTP for password reset is: ${otp}`,
        });
        otpStore[email] = otp;
        res.status(200).send("OTP sent for password reset");
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to send reset password email");
    }
}
export default ForgotPassword