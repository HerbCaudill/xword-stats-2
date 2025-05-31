import dotenv from 'dotenv'
dotenv.config()

export const headers = {
  accept: '*/*',
  'accept-language': 'en-US,en;q=0.9',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
  referer: 'https://www.nytimes.com/crosswords/archive/daily',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  cookie: `NYT-S=0^${process.env.NYT_SUBSCRIBER_TOKEN}; `,
  'cache-control': 'max-age=3600, must-revalidate',
  'if-none-match': '*',
  'if-modified-since': new Date(Date.now() - 24 * 60 * 60 * 1000).toUTCString(),
}
