declare module 'postmate' {
  export default class Postmate {
    static Model: any
    constructor(options: any)
    then(callback: (parent: any) => void): void
  }
}
