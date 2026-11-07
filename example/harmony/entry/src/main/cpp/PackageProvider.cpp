#include "RNOH/PackageProvider.h"
#include <sys/stat.h>
#include "GifPlayerPackage.h"

using namespace rnoh;
std::vector<std::shared_ptr<Package>> PackageProvider::getPackages(Package::Context ctx) {
    return {
        std::make_shared<GifPlayerPackage>(ctx),
    };
}
