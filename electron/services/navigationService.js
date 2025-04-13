class NavigationService {
  constructor() {
    this.navigationHistory = [];
  }

  addToHistory(path) {
    if (this.navigationHistory.length === 0 || this.navigationHistory[this.navigationHistory.length - 1] !== path) {
      this.navigationHistory.push(path);
    }
  }

  canGoBack() {
    return this.navigationHistory.length > 1;
  }

  goBack() {
    if (this.canGoBack()) {
      this.navigationHistory.pop();
      return this.navigationHistory[this.navigationHistory.length - 1];
    }
    return null;
  }

  canGoUp(path) {
    if (!path) return false;
    const parentDir = path.split('/').slice(0, -1).join('/');
    return parentDir !== '';
  }

  getParentDirectory(path) {
    if (!path) return null;
    const parentDir = path.split('/').slice(0, -1).join('/');
    return parentDir || null;
  }
}

module.exports = new NavigationService(); 