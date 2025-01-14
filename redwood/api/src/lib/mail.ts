import nodemailer from 'nodemailer'
import {htmlToText} from 'nodemailer-html-to-text'

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

transport.use('compile', htmlToText())

export default transport
