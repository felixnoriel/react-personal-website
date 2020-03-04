const withSass = require('@zeit/next-sass');
const withCss = require('@zeit/next-css');

const nextConfig = {
    target: 'serverless',
    env: {
        env: process.env.NODE_ENV,
        domain: 'https://whoisfelix.com',
    },
};

module.exports = withCss(withSass(nextConfig));

/*
{
    "Version": "2008-10-17",
    "Id": "",
    "Statement": [
        {
            "Sid": "Allow in my domains",
            "Effect": "Allow",
            "Principal": {
                "AWS": "*"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::felixstatic/*",
            "Condition": {
                "StringLike": {
                    "aws:Referer": [
                        "https://whoisfelix.com/*",
                        "https://felixnoriel-nextjs.felixnoriel.now.sh/*",
                        "http://localhost:3000"
                    ]
                }
            }
        },
        {
            "Sid": "Give not access if referer is no my sites",
            "Effect": "Deny",
            "Principal": {
                "AWS": "*"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::felixstatic/*",
            "Condition": {
                "StringNotLike": {
                    "aws:Referer": [
                        "https://whoisfelix.com/*",
                        "https://felixnoriel-nextjs.felixnoriel.now.sh/*",
                        "http://localhost:3000"
                    ]
                }
            }
        }
    ]
}
*/
