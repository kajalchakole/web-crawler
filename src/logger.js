import winston from "winston";

export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        // The Console transport will log all messages
        // This is in addition to the File transport
        // which logs all messages to a file
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/crawler.log'})
    ]
});