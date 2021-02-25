import Axios, { AxiosRequestConfig, AxiosInstance } from 'axios';
import { EventEmitter } from 'events';
import { DWInstance, dwinstance } from './dw';
import { OcapiRequestMethod, OcapiRequestContentType } from './ocapiSettings';
export declare interface Token {
  on(event: 'authorized', listener: (token: string, expiration: number) => void): this;
  on(event: 'expired', listener: (token: string, expiration: number) => void): this;
  on(event: string, listener: Function): this;
}
export class Token extends EventEmitter {
  authURL: string = 'https://account.demandware.com/dw/oauth2/access_token?grant_type=client_credentials';
  expiration: number;
  token: string;
  axios: AxiosInstance;
  timeout: NodeJS.Timeout;
  autorefresh: boolean = true;
  dwjson: DWInstance;
  constructor(dwjson?: DWInstance) {
    super();
    this.axios = Axios.create();
  }
  async authorize(): Promise<string> {
    if (!this.dwjson) {
      this.dwjson = await dwinstance();
    }
    const { data } = await this.axios.request({
      url: this.authURL,
      method: OcapiRequestMethod.POST,
      headers: {
        'content-type': OcapiRequestContentType.APPLICATION_URL_ENCODED
      },
      auth: {
        username: this.dwjson.clientID,
        password: this.dwjson.clientSecret
      }
    });
    this.token = data.access_token;
    this.expiration = new Date().getTime() + data.expires_in * 1000;
    this.emit('authorized', this.token, this.expiration);
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.emit('expired', this.token, this.expiration);
      if (this.autorefresh) {
        this.authorize();
      }
    }, data.expires_in * 1000);
    return this.token;
  }
}

export async function tokenstring() {
  const instance: Token = new Token();
  return await instance.authorize();
}
