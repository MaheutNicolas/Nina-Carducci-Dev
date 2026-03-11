(function($) {

  /**
   * Initialise la galerie sur l'élément sélectionné en appliquant
   * les options fournies (colonnes, lightbox, tags, etc.).
   * Parcourt chaque item de la galerie pour les mettre en forme,
   * les déplacer dans le wrapper de ligne, et collecter les tags.
   */
  $.fn.mauGallery = function(options) {
    var options = $.extend($.fn.mauGallery.defaults, options);
    var tagsCollection = [];
    return this.each(function() {
      $.fn.mauGallery.methods.createRowWrapper($(this));
      if (options.lightBox) {
        $.fn.mauGallery.methods.createLightBox(
          $(this),
          options.lightboxId,
          options.navigation
        );
      }
      $.fn.mauGallery.listeners(options);

      $(this)
        .children(".gallery-item")
        .each(function(index) {
          $.fn.mauGallery.methods.responsiveImageItem($(this));
          $.fn.mauGallery.methods.moveItemInRowWrapper($(this));
          $.fn.mauGallery.methods.wrapItemInColumn($(this), options.columns);
          var theTag = $(this).data("gallery-tag");
          if (
            options.showTags &&
            theTag !== undefined &&
            tagsCollection.indexOf(theTag) === -1
          ) {
            tagsCollection.push(theTag);
          }
        });

      if (options.showTags) {
        $.fn.mauGallery.methods.showItemTags(
          $(this),
          options.tagsPosition,
          tagsCollection
        );
      }

      $(this).fadeIn(500);
    });
  };

  /**
   * Valeurs par défaut du plugin.
   * Définit le comportement initial si aucune option n'est fournie :
   * 3 colonnes, lightbox activée, tags affichés en bas, navigation activée.
   */
  $.fn.mauGallery.defaults = {
    columns: 3,
    lightBox: true,
    lightboxId: null,
    showTags: true,
    tagsPosition: "bottom",
    navigation: true
  };

  /**
   * Initialise les écouteurs d'événements de la galerie.
   * Gère les clics sur les items (ouverture lightbox),
   * les clics sur les liens de navigation par tag,
   * ainsi que les boutons précédent/suivant de la lightbox.
   */
  $.fn.mauGallery.listeners = function(options) {
    $(".gallery-item").on("click", function() {
      if (options.lightBox && $(this).prop("tagName") === "IMG") {
        $.fn.mauGallery.methods.openLightBox($(this), options.lightboxId);
      } else {
        return;
      }
    });

    $(".gallery").on("click", ".nav-link", $.fn.mauGallery.methods.filterByTag);
    $(".gallery").on("click", ".mg-prev", () =>
      $.fn.mauGallery.methods.prevImage(options.lightboxId)
    );
    $(".gallery").on("click", ".mg-next", () =>
      $.fn.mauGallery.methods.nextImage(options.lightboxId)
    );
  };

  $.fn.mauGallery.methods = {

    /**
     * Crée un wrapper de type row Bootstrap dans la galerie.
     * Vérifie d'abord que le wrapper n'existe pas déjà
     * pour éviter les doublons lors de réinitialisations.
     */
    createRowWrapper(element) {
      if (
        !element
          .children()
          .first()
          .hasClass("row")
      ) {
        element.append('<div class="gallery-items-row row"></div>');
      }
    },

    /**
     * Enveloppe un item de galerie dans une colonne Bootstrap.
     * Accepte un nombre entier (colonnes fixes) ou un objet
     * avec des breakpoints responsives (xs, sm, md, lg, xl).
     * Affiche une erreur si le type fourni n'est pas supporté.
     */
    wrapItemInColumn(element, columns) {
      if (columns.constructor === Number) {
        element.wrap(
          `<div class='item-column mb-4 col-${Math.ceil(12 / columns)}'></div>`
        );
      } else if (columns.constructor === Object) {
        var columnClasses = "";
        if (columns.xs) {
          columnClasses += ` col-${Math.ceil(12 / columns.xs)}`;
        }
        if (columns.sm) {
          columnClasses += ` col-sm-${Math.ceil(12 / columns.sm)}`;
        }
        if (columns.md) {
          columnClasses += ` col-md-${Math.ceil(12 / columns.md)}`;
        }
        if (columns.lg) {
          columnClasses += ` col-lg-${Math.ceil(12 / columns.lg)}`;
        }
        if (columns.xl) {
          columnClasses += ` col-xl-${Math.ceil(12 / columns.xl)}`;
        }
        element.wrap(`<div class='item-column mb-4${columnClasses}'></div>`);
      } else {
        console.error(
          `Columns should be defined as numbers or objects. ${typeof columns} is not supported.`
        );
      }
    },

    /**
     * Déplace un item de galerie dans le wrapper de ligne.
     * Permet d'assurer que tous les éléments sont regroupés
     * correctement dans la structure Bootstrap row/col.
     */
    moveItemInRowWrapper(element) {
      element.appendTo(".gallery-items-row");
    },

    /**
     * Rend une image responsive en ajoutant la classe Bootstrap "img-fluid".
     * S'applique uniquement si l'élément est une balise IMG.
     */
    responsiveImageItem(element) {
      if (element.prop("tagName") === "IMG") {
        element.addClass("img-fluid");
      }
    },

    /**
     * Ouvre la lightbox modale et affiche l'image cliquée.
     * Met à jour le src de l'image dans la modale puis
     * déclenche l'affichage via Bootstrap modal toggle.
     */
    openLightBox(element, lightboxId) {
      $(`#${lightboxId}`)
        .find(".lightboxImage")
        .attr("src", element.attr("src"));
      $(`#${lightboxId}`).modal("toggle");
    },

    /**
     * Affiche l'image précédente dans la lightbox.
     * Recherche l'image actuellement affichée, puis construit
     * la collection d'images selon le tag actif.
     */
    prevImage() {
      let activeImage = null;
      $("img.gallery-item").each(function() {
        if ($(this).attr("src") === $(".lightboxImage").attr("src")) {
          activeImage = $(this);
        }
      });
      let activeTag = $(".tags-bar span.active").data("images-toggle");
      let imagesCollection = [];
      if (activeTag === "all") {
        $(".item-column").each(function() {
          if ($(this).children("img").length) {
            imagesCollection.push($(this).children("img"));
          }
        });
      } else {
        $(".item-column").each(function() {
          if (
            $(this)
              .children("img")
              .data("gallery-tag") === activeTag
          ) {
            imagesCollection.push($(this).children("img"));
          }
        });
      }
      let index = 0,
        next = null;

      $(imagesCollection).each(function(i) {
        if ($(activeImage).attr("src") === $(this).attr("src")) {
          index = i - 1;
        }
      });
      next =
        imagesCollection[index] ||
        imagesCollection[imagesCollection.length - 1];
      $(".lightboxImage").attr("src", $(next).attr("src"));
    },

    /**
     * Affiche l'image suivante dans la lightbox.
     * Recherche l'image actuellement affichée, puis construit
     * la collection d'images selon le tag actif.
     */
    nextImage() {
      let activeImage = null;
      $("img.gallery-item").each(function() {
        if ($(this).attr("src") === $(".lightboxImage").attr("src")) {
          activeImage = $(this);
        }
      });
      let activeTag = $(".tags-bar span.active").data("images-toggle");
      let imagesCollection = [];
      if (activeTag === "all") {
        $(".item-column").each(function() {
          if ($(this).children("img").length) {
            imagesCollection.push($(this).children("img"));
          }
        });
      } else {
        $(".item-column").each(function() {
          if (
            $(this)
              .children("img")
              .data("gallery-tag") === activeTag
          ) {
            imagesCollection.push($(this).children("img"));
          }
        });
      }
      let index = 0,
        next = null;

      $(imagesCollection).each(function(i) {
        if ($(activeImage).attr("src") === $(this).attr("src")) {
          index = i;
        }
      });
      next = imagesCollection[index + 1] || imagesCollection[0];
      $(".lightboxImage").attr("src", $(next).attr("src"));
    },

    /**
     * Génère et insère la modale Bootstrap servant de lightbox.
     * Utilise l'identifiant fourni ou "galleryLightbox" par défaut.
     * Ajoute les boutons de navigation précédent/suivant si l'option
     * navigation est activée.
    */
    createLightBox(gallery, lightboxId, navigation) {
      gallery.append(`<div class="modal fade" id="${
        lightboxId ? lightboxId : "galleryLightbox"
      }" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-body">
                            ${
                              navigation
                                ? '<div class="mg-prev" style="cursor:pointer;position:absolute;top:50%;left:-15px;background:white;"><</div>'
                                : '<span style="display:none;" />'
                            }
                            <img class="lightboxImage img-fluid" alt="Contenu de l'image affichée dans la modale au clique"/>
                            ${
                              navigation
                                ? '<div class="mg-next" style="cursor:pointer;position:absolute;top:50%;right:-15px;background:white;}">></div>'
                                : '<span style="display:none;" />'
                            }
                        </div>
                    </div>
                </div>
            </div>`);
    },

    /**
     * Affiche la barre de filtrage par tags.
     * Génère dynamiquement les boutons de filtre à partir
     * de la collection de tags collectés lors de l'initialisation.
     * Insère la barre en haut ou en bas de la galerie selon l'option tagsPosition.
     */
    showItemTags(gallery, position, tags) {
      var tagItems =
        '<li class="nav-item"><span class="nav-link active active"  data-images-toggle="all">Tous</span></li>';
      $.each(tags, function(index, value) {
        tagItems += `<li class="nav-item active">
                <span class="nav-link"  data-images-toggle="${value}">${value}</span></li>`;
      });
      var tagsRow = `<ul class="my-4 tags-bar nav nav-pills">${tagItems}</ul>`;

      if (position === "bottom") {
        gallery.append(tagsRow);
      } else if (position === "top") {
        gallery.prepend(tagsRow);
      } else {
        console.error(`Unknown tags position: ${position}`);
      }
    },

    /**
     * Filtre les items de la galerie selon le tag sélectionné.
     * Si le tag "all" est actif, tous les items sont affichés.
     * Sinon, seuls les items correspondant au tag cliqué sont visibles.
     * Gère également l'état actif visuel du bouton de filtre sélectionné.
     */
    filterByTag() {
      if ($(this).hasClass("active")) {
        return;
      }
      $(".active").removeClass("active active");
      $(this).addClass("active");

      var tag = $(this).data("images-toggle");

      $(".gallery-item").each(function() {
        $(this)
          .parents(".item-column")
          .hide();
        if (tag === "all") {
          $(this)
            .parents(".item-column")
            .show(300);
        } else if ($(this).data("gallery-tag") === tag) {
          $(this)
            .parents(".item-column")
            .show(300);
        }
      });
    }
  };
})(jQuery);
