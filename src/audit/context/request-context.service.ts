export class RequestContext {

  private static userId: number;

  static setUserId(id: number) {
    RequestContext.userId = id;
  }

  static getUserId() {
    return RequestContext.userId;
  }

}