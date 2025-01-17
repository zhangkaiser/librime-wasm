RIME_ROOT ?= $(CURDIR)

prefix ?= $(DESTDIR)/usr

debug install-debug uninstall-debug test-debug: build ?= debug
build ?= build

.PHONY: all deps thirdparty xcode clean \
librime librime-static install-librime uninstall-librime \
release debug test install uninstall install-debug uninstall-debug

all: release

# `thirdparty` is deprecated in favor of `deps`
deps thirdparty:
	$(MAKE) -f deps.mk

deps/%:
	$(MAKE) -f deps.mk $(@:deps/%=%)

thirdparty/%:
	$(MAKE) -f deps.mk $(@:thirdparty/%=%)

xcode:
	$(MAKE) -f xcode.mk

xcode/%:
	$(MAKE) -f xcode.mk $(@:xcode/%=%)

clean:
	rm -Rf build debug

librime: release
install-librime: install
uninstall-librime: uninstall

librime-static:
	cmake . -B$(build) \
	-DCMAKE_INSTALL_PREFIX=$(prefix) \
	-DCMAKE_BUILD_TYPE=Release \
	-DBUILD_STATIC=ON \
	-DBUILD_SHARED_LIBS=OFF
	cmake --build $(build)

release:
	emcmake cmake . -B$(build) \
	-DCMAKE_INSTALL_PREFIX=$(prefix) \
	-DCMAKE_BUILD_TYPE=Release \
	-DBUILD_MERGED_PLUGINS=OFF \
	-DENABLE_EXTERNAL_PLUGINS=OFF \
	-DBUILD_TEST=OFF \
	-DBUILD_STATIC=ON \
	-DBUILD_SHARED_LIBS=OFF \
	-DBOOST_USE_SIGNALS2=ON \
	-DENABLE_LOGGING=ON \
	-DBOOST_USE_CXX11=ON \
	-DCMAKE_TOOLCHAIN_FILE=${EM_CMAKE_PATH} \
	-DCMAKE_CXX_FLAGS="${CMAKE_CXX_FLAGS} -pthread" \
	-DBOOST_INCLUDEDIR:FILEPATH=${RIME_ROOT}/deps/boost/include \
	-DBOOST_LIBRARYDIR:FILEPATH=${RIME_ROOT}/deps/boost/lib
	cmake --build $(build)

merged-plugins:
	cmake . -B$(build) \
	-DCMAKE_INSTALL_PREFIX=$(prefix) \
	-DCMAKE_BUILD_TYPE=Release \
	-DBUILD_MERGED_PLUGINS=ON \
	-DENABLE_EXTERNAL_PLUGINS=OFF
	cmake --build $(build)

debug:
	cmake . -B$(build) \
	-DCMAKE_INSTALL_PREFIX=$(prefix) \
	-DCMAKE_BUILD_TYPE=Debug \
	-DBUILD_MERGED_PLUGINS=OFF \
	-DENABLE_EXTERNAL_PLUGINS=ON
	cmake --build $(build)

install:
	cmake --build $(build) --target install

install-debug:
	cmake --build $(build) --target install

uninstall:
	cmake --build $(build) --target uninstall

uninstall-debug:
	cmake --build $(build) --target uninstall

test: release
	(cd $(build)/test; ./rime_test)

test-debug: debug
	(cd $(build)/test; ./rime_test)
