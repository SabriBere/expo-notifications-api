import { notificationsHistory } from "../../mocks/mockUpsAlert";

class NewsServices {
  static getAllNews() {
    return notificationsHistory;
  }
}

export default NewsServices;