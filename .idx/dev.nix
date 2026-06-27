{ pkgs, ... }: {
  channel = "stable-24.05";

  packages = [
    pkgs.nodejs_20
    pkgs.chromium          # Puppeteer için (PDF üretimi)
  ];

  env = {
    PUPPETEER_EXECUTABLE_PATH = "${pkgs.chromium}/bin/chromium";
  };

  idx.previews = {
    enable = true;
    previews = {
      web = {
        command = ["npm" "run" "dev"];
        manager = "web";
        port = 3000;
      };
    };
  };
}
