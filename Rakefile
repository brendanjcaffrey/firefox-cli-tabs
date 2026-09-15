ROOT = __dir__

namespace :logo do
  desc 'regenerate the raycast and firefox extension icons from logo/logo.svg (needs librsvg)'
  task :generate do
    require 'fileutils'

    source = "#{ROOT}/logo/logo.svg"
    # raycast wants a single 512px icon; firefox uses 48px in the add-ons
    # manager and 96px on high-dpi displays
    outputs = {
      "#{ROOT}/raycast/assets/extension-icon.png" => 512,
      "#{ROOT}/extension/icons/icon-48.png" => 48,
      "#{ROOT}/extension/icons/icon-96.png" => 96
    }

    outputs.each do |out, px|
      FileUtils.mkdir_p(File.dirname(out))
      # rsvg-convert renders the gradient; imagemagick's built-in svg renderer
      # draws it black
      sh 'rsvg-convert', '--width', px.to_s, '--height', px.to_s, '--output', out, source
      puts "wrote #{out}"
    end
  end
end

namespace :raycast do
  desc 'run the raycast extension in dev mode (imports it into raycast, hot reloads)'
  task :dev do
    Dir.chdir("#{ROOT}/raycast") do
      sh 'npm install'
      sh 'npm run dev'
    end
  end

  desc 'publish the raycast extension to the jcaffrey org store (needs `npx ray login`)'
  task :publish do
    Dir.chdir("#{ROOT}/raycast") do
      sh 'npm install'
      sh 'npm run publish'
    end
  end
end

namespace :firefox do
  desc 'lint the firefox extension and zip it into build/ for uploading to the developer hub (needs web-ext); ' \
       'refuses to overwrite an existing archive for the same version unless FORCE=1'
  task :archive do
    require 'json'
    require 'fileutils'

    version = JSON.parse(File.read("#{ROOT}/extension/manifest.json"))['version']
    out = "#{ROOT}/build/cli-tabs-#{version}.zip"
    # an existing archive was likely already uploaded, and the developer hub
    # rejects a repeat version anyway, so make rebuilding it deliberate
    if File.exist?(out) && ENV['FORCE'] != '1'
      abort "#{out} already exists; bump version in extension/manifest.json, or rerun with FORCE=1 to overwrite it"
    end
    FileUtils.mkdir_p(File.dirname(out))
    FileUtils.rm_f(out)

    Dir.chdir("#{ROOT}/extension") do
      sh 'web-ext lint'
      sh 'zip', '-r', out, '.', '-x', '.DS_Store', '*/.DS_Store'
    end
    puts "wrote #{out}"
  end
end
