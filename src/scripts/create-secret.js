import crypto from 'node:crypto';

const main = () => {
  const apiKey = crypto.randomBytes(32).toString('hex');
  console.log(apiKey)
}

main()
