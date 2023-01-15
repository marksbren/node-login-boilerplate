// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)


const sendForgotPasswordEmail = (email, reset_url) => {
  if(process.env.NODE_ENV === 'test'){ return }
  sgMail.send({
      to: email, // receiver email address
      from: process.env.SENDGRID_FROM_EMAIL, 
      templateId: process.env.SENDGRID_PASSWORD_RESET_TEMPLATE,
      dynamic_template_data: {
        reset_url: reset_url
      },
      
  })
}

const sendEmailVerification = (email, token_url) => {
  if(process.env.NODE_ENV === 'test'){ return }
  sgMail.send({
      to: email, // receiver email address
      from: process.env.SENDGRID_FROM_EMAIL, 
      templateId: process.env.SENDGRID_EMAIL_VERIFICATION_TEMPLATE,
      dynamic_template_data: {
        token_url: token_url
      },
      
  })
}

module.exports = {
  sendForgotPasswordEmail,
  sendEmailVerification

}
  